import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    Button, Input, Separator,
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
    Switch, Label,
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@open-urbis/map-ui';
import { ArrowLeft, Save, Loader2, Tag, User, Link as LinkIcon, Download, Globe, Lock, Folder, Plus, ListTree, Bug, Search } from 'lucide-react';
import { CreatePageDto, Page, PageType } from '../../types/page';
import { LegisEditor } from '../Editor/LegisEditor';
import { JSONContent, type Editor as TiptapEditor } from '@tiptap/core';
import { useAuth } from '@open-urbis/map-auth';
import { safeJSONParse } from '@/lib/content';
import { pageService } from '../../services/page-service';
import { categoryService, Category } from '../../services/category-service';
import { toast } from 'sonner';
import { RulesEngine } from '../../domain/rules-engine';
import { SpecialSituationsPanel as PropertiesPanel } from './SpecialSituationsPanel';
import { suggestionItems as defaultSuggestionItems } from '../Editor/slash-command';
import { useDebounce } from '@/hooks/use-debounce';
import { OriginalNormativo, NormativeElementEntity as NormativeElement, ColetaneaTematica, CollectionLink, ElementType } from '../../domain/entities';
import { NormativeMetadataForm } from './NormativeMetadataForm';
import { DOMSerializer } from '@tiptap/pm/model';
import { validateNormativeStructure, ValidationIssue } from '../../domain/normative-validation';
import { getElementKey } from '../../domain/display-logic';
import { normalizeOrdinals } from '../../domain/text-utils';

// Helper to extract links from content
const extractLinks = (content: JSONContent | undefined): CollectionLink[] => {
    if (!content) return [];
    const linksMap = new Map<string, CollectionLink>();
    
    const traverse = (node: JSONContent) => {
        if (node.type === 'reference' && node.attrs) {
            const { pageId, elementId } = node.attrs;
            if (pageId) {
                if (!linksMap.has(pageId)) {
                    linksMap.set(pageId, {
                        resourceId: pageId,
                        resourceType: 'original_normativo',
                        linkedElements: []
                    });
                }
                const link = linksMap.get(pageId)!;
                if (elementId && elementId !== 'root') {
                    if (!link.linkedElements?.find(e => e.elementId === elementId)) {
                        if (!link.linkedElements) link.linkedElements = [];
                        link.linkedElements.push({ elementId });
                    }
                }
            }
        }
        if (node.content) node.content.forEach(traverse);
    };
    
    if (content) traverse(content);
    return Array.from(linksMap.values());
};

// Hierarchy Definition
const PARENT_HIERARCHY: Record<string, string[]> = {
    'Parte': [],
    'Livro': ['Parte'],
    'Título': ['Livro', 'Parte'],
    'Capítulo': ['Título', 'Livro', 'Parte'],
    'Seção': ['Capítulo', 'Título', 'Livro', 'Parte'],
    'Subseção': ['Seção', 'Capítulo', 'Título', 'Livro', 'Parte'],
    'Divisão desconforme': [],
    'Artigo': ['Subseção', 'Seção', 'Capítulo', 'Título', 'Livro', 'Parte', 'Anexo'],
    'Parágrafo': ['Artigo', 'Anexo'],
    'Inciso': ['Parágrafo', 'Artigo'],
    'Alínea': ['Inciso'],
    'Item': ['Alínea'],
    'Anexo': [],
    'Elemento desconforme': ['Item', 'Alínea', 'Inciso', 'Parágrafo', 'Artigo', 'Subseção', 'Seção', 'Capítulo', 'Título', 'Livro', 'Parte', 'Anexo'],
    'Tabela': ['Item', 'Alínea', 'Inciso', 'Parágrafo', 'Artigo', 'Subseção', 'Seção', 'Capítulo', 'Título', 'Livro', 'Parte', 'Anexo'],
    'Figura': ['Item', 'Alínea', 'Inciso', 'Parágrafo', 'Artigo', 'Subseção', 'Seção', 'Capítulo', 'Título', 'Livro', 'Parte', 'Anexo'],
    'Mapa': ['Item', 'Alínea', 'Inciso', 'Parágrafo', 'Artigo', 'Subseção', 'Seção', 'Capítulo', 'Título', 'Livro', 'Parte', 'Anexo'],
    'Nota': ['Item', 'Alínea', 'Inciso', 'Parágrafo', 'Artigo', 'Anexo'],
    'Texto': ['Item', 'Alínea', 'Inciso', 'Parágrafo', 'Artigo', 'Subseção', 'Seção', 'Capítulo', 'Título', 'Livro', 'Parte', 'Anexo']
};

const COLETANEA_TYPES = ['Exigências', 'Competências', 'Definições', 'Fontes de Informação'];
const COLETANEA_CATEGORIES = [
    'Documentos e profissionais técnicos', 'Docrumentos gerais', 'Infraestrutura e obras públicas',
    'Urbanístico / parcelamento, uso e ocupação', 'Edilício / obras e edificações',
    'Acessibilidade, salubridade e segurança', 'Vegetação e áreas protegidas', 'Preservação cultural'
];

interface PageFormProps {
    initialData?: Page;
    onSubmit: (data: CreatePageDto) => Promise<void>;
    onCancel: () => void;
    loading?: boolean;
    title?: string;
}

export function PageForm({ initialData, onSubmit, onCancel, loading = false, title: formTitle }: PageFormProps) {
    const auth = useAuth();
    const [title, setTitle] = useState(initialData?.title || '');
    const [type, setType] = useState<PageType>(() => {
        if (!initialData) return 'coletanea_tematica';
        return initialData.type === 'page' ? 'coletanea_tematica' : (initialData.type === 'normative' ? 'original_normativo' : initialData.type);
    });
    
    const [author, setAuthor] = useState(initialData?.author || auth.user?.profile.name || '');
    const [tagsInput, setTagsInput] = useState(initialData?.tags?.join(', ') || '');
    const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
    const [isPublic, setIsPublic] = useState(initialData?.isPublic ?? false);
    const [sourceUrl, setSourceUrl] = useState(initialData?.source?.url || '');
    const [sourceType, setSourceType] = useState<"html" | "pdf" | "location">(initialData?.source?.type || 'html');
    const [content, setContent] = useState<JSONContent | undefined>(
        initialData?.content ? safeJSONParse(initialData.content) : undefined
    );
    
    const [normativeData, setNormativeData] = useState<Partial<OriginalNormativo>>({});
    const [coletaneaData, setColetaneaData] = useState<Partial<ColetaneaTematica>>({});

    useEffect(() => {
        if (!initialData && type === 'coletanea_tematica') {
            const params = new URLSearchParams(window.location.search);
            const cat = params.get('category');
            if (cat && COLETANEA_TYPES.includes(cat)) {
                setColetaneaData(prev => ({ ...prev, collectionType: cat as any }));
            }
        }
    }, [initialData, type]);

    const [categories, setCategories] = useState<Category[]>([]);
    const [editor, setEditor] = useState<TiptapEditor | null>(null);
    const [importOpen, setImportOpen] = useState(false);
    const [importUrl, setImportUrl] = useState('');
    const [importing, setImporting] = useState(false);

    const [selectedElements, setSelectedElements] = useState<NormativeElement[]>([]);
    const rulesEngine = useMemo(() => new RulesEngine(), []);
    const [structuredElements, setStructuredElements] = useState<NormativeElement[]>([]);
    const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
    const [saveConfirmationOpen, setSaveConfirmationOpen] = useState(false);

    const getLastElementDescription = () => {
        const elements = structuredElements.length > 0 ? structuredElements : normativeData.elements || [];
        if (elements.length === 0) return "Nenhum elemento";
        const idx = elements.findIndex(el => el.type === 'Anexo');
        const target = idx !== -1 ? (idx > 0 ? elements[idx-1] : elements[0]) : elements[elements.length-1];
        return target ? `${target.type} ${target.index || ''}`.trim() : "";
    };

    const performSync = useCallback((editor: TiptapEditor, currentElements: NormativeElement[], options: { selectionOnly?: boolean } = {}) => {
        const blocks: any[] = [];
        const serializer = DOMSerializer.fromSchema(editor.schema);
        const { from, to } = editor.state.selection;
        
        editor.state.doc.descendants((node, pos, parent) => {
            // Só processamos nós de primeiro nível (filhos diretos do doc)
            if (parent?.type.name !== 'doc') return true;

            // If selectionOnly is true, we only process nodes that are within the selection range
            // or already have a normativeId (to maintain full context)
            const isOutsideSelection = options.selectionOnly && (pos + node.nodeSize <= from || pos >= to);
            
            if (node.type.name === 'paragraph' || node.type.name === 'heading') {
                const text = node.textContent;
                if (text.trim()) {
                    const fragment = serializer.serializeFragment(node.content);
                    const tempDiv = document.createElement('div');
                    tempDiv.appendChild(fragment);
                    
                    // Normalize ordinals in text nodes
                    const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT);
                    let textNode;
                    while (textNode = walker.nextNode()) {
                        if (textNode.nodeValue) {
                            textNode.nodeValue = normalizeOrdinals(textNode.nodeValue);
                        }
                    }

                    blocks.push({ 
                        text, 
                        html: tempDiv.innerHTML, 
                        content: node.toJSON(),
                        isTarget: !isOutsideSelection // Mark if this block is a target for re-structuring
                    });
                }
            } else if (node.type.name === 'table') {
                const tableData: any = { rows: [], cols: [], cells: [] };
                // Reuse existing ID if available in editor attrs
                const tableId = node.attrs.normativeId || crypto.randomUUID();
                let rowIdx = 1;
                const genId = () => Math.floor(Math.random() * 100000).toString();
                
                let maxCols = 0;
                node.content.forEach((row) => {
                    let rowCols = 0;
                    row.content.forEach((cell) => {
                        rowCols += (cell.attrs.colspan || 1);
                    });
                    maxCols = Math.max(maxCols, rowCols);
                });
                
                for (let i = 0; i < maxCols; i++) {
                    tableData.cols.push({ id: genId(), type: 'Corpo', index: i + 1 });
                }

                node.content.forEach((row, rI) => {
                    const rowId = genId();
                    tableData.rows.push({ id: rowId, type: rI === 0 ? 'Cabeçalho' : 'Corpo', index: rowIdx++ });
                    
                    let colIdx = 0;
                    row.content.forEach((cell) => {
                        const cellFragment = serializer.serializeFragment(cell.content);
                        const tempDiv = document.createElement('div');
                        tempDiv.appendChild(cellFragment);

                        // Normalize ordinals in text nodes
                        const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT);
                        let textNode;
                        while (textNode = walker.nextNode()) {
                            if (textNode.nodeValue) {
                                textNode.nodeValue = normalizeOrdinals(textNode.nodeValue);
                            }
                        }

                        tableData.cells.push({ 
                            rowId, 
                            colId: tableData.cols[colIdx].id, 
                            text: tempDiv.innerHTML || '',
                            rowSpan: cell.attrs.rowspan || 1,
                            colSpan: cell.attrs.colspan || 1
                        });
                        
                        colIdx += (cell.attrs.colspan || 1);
                    });
                });

                let tableTitle = 'Tabela';
                let tableHtml = 'Tabela';
                const lastBlock = blocks[blocks.length - 1];
                if (lastBlock && lastBlock.text.toLowerCase().includes('tabela')) {
                    tableTitle = lastBlock.text;
                    tableHtml = lastBlock.html;
                }

                blocks.push({ 
                    text: tableTitle, 
                    html: tableHtml, 
                    content: { ...node.toJSON(), attrs: { ...node.attrs, normativeId: tableId } }, 
                    type: 'Tabela', 
                    tableData,
                    isTarget: !isOutsideSelection
                });
            } else if (node.type.name === 'image') {
                const elementId = node.attrs.normativeId || crypto.randomUUID();
                
                // Smart Title detection for Image/Map
                let elementTitle = 'Figura';
                let elementHtml = 'Figura';
                let elementType: ElementType = 'Figura';
                
                const lastBlock = blocks[blocks.length - 1];
                const isMapTitle = lastBlock && lastBlock.text.toLowerCase().includes('mapa');
                const isFigureTitle = lastBlock && lastBlock.text.toLowerCase().includes('figura');

                if (lastBlock && (isMapTitle || isFigureTitle)) {
                    elementTitle = lastBlock.text;
                    elementHtml = lastBlock.html;
                    elementType = isMapTitle ? 'Mapa' : 'Figura';
                }

                const commonData = {
                    text: elementTitle,
                    html: elementHtml,
                    content: { ...node.toJSON(), attrs: { ...node.attrs, normativeId: elementId } },
                    type: elementType
                };

                if (elementType === 'Mapa') {
                    blocks.push({
                        ...commonData,
                        mapData: {
                            screen: { 
                                url: node.attrs.src, 
                                resolution: { width: node.attrs.width, height: node.attrs.height } 
                            },
                            files: []
                        },
                        isTarget: !isOutsideSelection
                    });
                } else {
                    blocks.push({
                        ...commonData,
                        figureData: {
                            url: node.attrs.src,
                            resolution: { width: node.attrs.width, height: node.attrs.height }
                        },
                        isTarget: !isOutsideSelection
                    });
                }
            }
            return false; // Não descer para filhos dos blocos de primeiro nível
        });

        const activeParents: any = {};
        const usedIds = new Set<string>();

        const newElements: NormativeElement[] = blocks.map(block => {
            const idFromEditor = block.content?.attrs?.normativeId;
            let existing = currentElements.find(e => e.id === idFromEditor);
            
            // Check if existing ID is already used (e.g. duplicate nodes in editor)
            if (existing && usedIds.has(existing.id)) {
                existing = undefined;
            }
            
            // If it's NOT a target block and we have an ID from editor, we MUST stick to existing data
            if (!block.isTarget && existing) {
                const id = existing.id;
                // Even if not a target, we update its hierarchy position in activeParents for subsequent target blocks
                activeParents[existing.type] = id;
                usedIds.add(id);
                return { ...existing, text: block.html }; // Update text content just in case
            }

            const parsed = rulesEngine.parseLine(block.text);
            
            // Priority: Block Type (Table/Figure/Map) > Parsed Type
            const type = (block.type || parsed.type) as ElementType;
            const index = (block.type === 'Tabela' || block.type === 'Figura' || block.type === 'Mapa') ? undefined : parsed.index;
            
            if (!existing) {
                // Se não achou pelo ID, tenta encontrar um elemento órfão (não vinculado a nenhum nó atual) que combine
                existing = currentElements.find(e => 
                    !usedIds.has(e.id) &&
                    e.type === type && 
                    e.index === index && 
                    (block.tableData ? true : e.text === block.html)
                );
            }

            let id = idFromEditor;
            // If idFromEditor is already used, or missing, try existing found by content, or generate new
            if (!id || usedIds.has(id)) {
                id = existing?.id || crypto.randomUUID();
            }
            // Ensure even the existing/random ID is not used (paranoid check)
            if (usedIds.has(id)) {
                id = crypto.randomUUID();
            }
            usedIds.add(id);
            
            let parentId = existing?.parentId;
            // Always recalculate parentId for target blocks to maintain consistency
            const allowed = PARENT_HIERARCHY[type] || [];
            for (const pType of allowed) { if (activeParents[pType]) { parentId = activeParents[pType]; break; } }
            
            activeParents[type] = id;

            return {
                id, 
                type: existing?.type || type, 
                index: existing?.index || index, 
                text: block.html, 
                parentId,
                originalStartValidity: existing?.originalStartValidity || { date: '', deviceId: '' },
                specialSituations: existing?.specialSituations || block.content?.attrs?.specialSituations || [],
                tableData: block.tableData,
                figureData: block.figureData,
                mapData: block.mapData
            };
        });

        // Only update states if changed to avoid infinite loops
        const elementsChanged = JSON.stringify(newElements) !== JSON.stringify(currentElements);
        if (elementsChanged) {
            setStructuredElements(newElements);
            setValidationIssues(validateNormativeStructure(newElements as any));
        }

        // Return the final blocks with their normative IDs to update the editor if necessary
        return { newElements, blocks, elementsChanged };
    }, [rulesEngine]);

    const handleAutoStructure = () => {
        if (!editor) return;
        
        // If there's a selection, we only structure the selection
        const { from, to } = editor.state.selection;
        const selectionOnly = from !== to;
        
        const { newElements, blocks } = performSync(editor, structuredElements, { selectionOnly });
        
        // Update Editor Content with the IDs
        // We MUST preserve the node structure (marks, content) instead of raw HTML
        // Note: newElements and blocks are 1:1 mapped by index from blocks.map in performSync
        editor.commands.setContent({ 
            type: 'doc', 
            content: blocks.map((b, i) => {
                // IMPORTANT: The element at index 'i' in newElements corresponds to the block at index 'i'
                const elementId = newElements[i].id;
                
                return { 
                    ...b.content, 
                    attrs: { ...b.content.attrs, normativeId: elementId } 
                };
            }) 
        });
        
        // Restore selection
        try {
            editor.commands.setTextSelection({ from, to });
        } catch (e) {
            console.warn("Could not restore selection exactly", e);
        }

        toast.success("Estrutura sincronizada");
    };

    useEffect(() => {
        categoryService.getAll().then(setCategories);
    }, []);

    useEffect(() => {
        if (editor && type === 'original_normativo') {
            const handler = () => {
                const { from, to, $from, $to } = editor.state.selection as any;
                const selected: any[] = [];
                
                const findNormativeId = (pos: any) => {
                    for (let i = pos.depth; i >= 0; i--) {
                        const node = pos.node(i);
                        if (node.attrs?.normativeId) return node.attrs.normativeId;
                    }
                    return null;
                };

                // 1. Check start and end of selection for parent normativeId
                const startId = findNormativeId($from);
                const endId = findNormativeId($to);

                if (startId) {
                    const el = structuredElements.find(e => e.id === startId);
                    if (el) selected.push(el);
                }
                
                if (endId && endId !== startId) {
                    const el = structuredElements.find(e => e.id === endId);
                    if (el && !selected.find(s => s.id === el.id)) selected.push(el);
                }

                // 2. Standard nodesBetween check for blocks fully inside selection
                if (selected.length === 0) {
                    editor.state.doc.nodesBetween(from, to, (node) => {
                        if (node.attrs?.normativeId) {
                            const el = structuredElements.find(e => e.id === node.attrs.normativeId);
                            if (el && !selected.find(s => s.id === el.id)) selected.push(el);
                        }
                    });
                }
                
                setSelectedElements(selected);
            };
            editor.on('selectionUpdate', handler);

            // Sincronização leve de texto em tempo real
            const textUpdateHandler = () => {
                const serializer = DOMSerializer.fromSchema(editor.schema);
                const updates: Record<string, string> = {};
                
                editor.state.doc.descendants((node) => {
                    if (node.attrs?.normativeId) {
                        const fragment = serializer.serializeFragment(node.content);
                        const tempDiv = document.createElement('div');
                        tempDiv.appendChild(fragment);
                        updates[node.attrs.normativeId] = tempDiv.innerHTML;
                    }
                    return node.isBlock;
                });

                if (Object.keys(updates).length > 0) {
                    setStructuredElements(prev => {
                        let hasChanged = false;
                        const next = prev.map(el => {
                            if (updates[el.id] !== undefined && el.text !== updates[el.id]) {
                                hasChanged = true;
                                return { ...el, text: updates[el.id] };
                            }
                            return el;
                        });
                        return hasChanged ? next : prev;
                    });
                }
            };
            editor.on('update', textUpdateHandler);

            return () => { 
                editor.off('selectionUpdate', handler);
                editor.off('update', textUpdateHandler);
            };
        }
    }, [editor, type, structuredElements]);

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title);
            setAuthor(initialData.author);
            setTagsInput(initialData.tags?.join(', ') || '');
            setCategoryId(initialData.categoryId || '');
            setIsPublic(initialData.isPublic ?? false);
            if (initialData.entity) {
                if (initialData.type === 'original_normativo') {
                    setNormativeData(initialData.entity as any);
                    setStructuredElements((initialData.entity as any).elements || []);
                } else {
                    setColetaneaData(initialData.entity as any);
                }
            }
        }
    }, [initialData]);

    const executeSave = async () => {
        const entityData = type === 'original_normativo' 
            ? { ...normativeData, name: title, elements: structuredElements } 
            : { ...coletaneaData, title, links: extractLinks(content) };
            
        await onSubmit({ 
            title, 
            type, 
            author, 
            tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean), 
            categoryId, 
            isPublic, 
            content: JSON.stringify(content), 
            entityData: entityData as any 
        });
        setSaveConfirmationOpen(false);
    };

    const isNormative = type === 'original_normativo';

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-background">
            <div className="sticky top-0 flex w-full items-center justify-between px-6 py-3 bg-background/80 backdrop-blur-sm border-b z-50">
                <div className="flex items-center gap-4 text-muted-foreground cursor-pointer" onClick={onCancel}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-sm font-medium">{formTitle || 'Documento'}</span>
                </div>
                <div className="flex items-center gap-2">
                    {isNormative && (
                        <Button variant="ghost" size="sm" onClick={handleAutoStructure} className="gap-2">
                            <ListTree className="h-4 w-4" /> Auto-Estruturar
                        </Button>
                    )}
                    <Button onClick={() => setSaveConfirmationOpen(true)} size="sm" className="gap-2">
                        <Save className="h-3 w-3" /> Salvar
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden min-w-0">
                <div className="flex-1 overflow-y-auto min-w-0">
                    <div className="container max-w-4xl mx-auto px-8 py-12 space-y-8">
                        
                        <div className="space-y-4">
                            <textarea
                                placeholder="Título"
                                className="w-full text-5xl font-extrabold bg-transparent outline-none resize-none placeholder:text-muted-foreground/30 leading-tight"
                                rows={1}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                            
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => !initialData && setType('coletanea_tematica')}
                                    disabled={!!initialData}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${type === 'coletanea_tematica' ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'} ${!!initialData ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    Coletânea Temática
                                </button>
                                <button 
                                    onClick={() => !initialData && setType('original_normativo')}
                                    disabled={!!initialData}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${type === 'original_normativo' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'hover:bg-muted text-muted-foreground'} ${!!initialData ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    Original Normativo
                                </button>
                            </div>

                            {type === 'original_normativo' ? (
                                <NormativeMetadataForm 
                                    data={normativeData} 
                                    onChange={setNormativeData} 
                                    title={title}
                                    onTitleChange={setTitle}
                                />
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 items-start text-sm pt-2 bg-muted/10 p-4 rounded-lg border">
                                    <div className="col-span-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">
                                        Ficha Coletânea
                                    </div>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                                            <Label className="text-muted-foreground text-xs">Tipo (*)</Label>
                                            <Select value={coletaneaData.collectionType} onValueChange={(v) => setColetaneaData({...coletaneaData, collectionType: v as any})}>
                                                <SelectTrigger className="h-8 bg-background text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                <SelectContent>{COLETANEA_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                                            <Label className="text-muted-foreground text-xs">Categoria (*)</Label>
                                            <Select value={coletaneaData.category} onValueChange={(v) => setColetaneaData({...coletaneaData, category: v as any})}>
                                                <SelectTrigger className="h-8 bg-background text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                <SelectContent>{COLETANEA_CATEGORIES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                                            <Label className="text-muted-foreground text-xs">Tema (*)</Label>
                                            <Input value={coletaneaData.theme || ''} onChange={(e) => setColetaneaData({...coletaneaData, theme: e.target.value as any})} className="h-8 bg-background text-xs" placeholder="Ex: Legitimidade" />
                                        </div>
                                        <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                                            <Label className="text-muted-foreground text-xs">Vínculos</Label>
                                            <div className="h-8 flex items-center px-3 border rounded-md bg-muted/50 text-[10px] text-muted-foreground w-full">
                                                <LinkIcon className="mr-2 h-3 w-3" />
                                                <span>{extractLinks(content).length} vínculos identificados</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-2 mt-2">
                                        <Label className="text-muted-foreground text-xs mb-1 block">Descrição Resumida</Label>
                                        <Input value={coletaneaData.shortDescription || ''} onChange={(e) => setColetaneaData({...coletaneaData, shortDescription: e.target.value})} className="h-8 bg-background text-xs" placeholder="Resumo em linguagem simples..." />
                                    </div>
                                </div>
                            )}
                        </div>

                        <Separator />

                    <div className="min-h-[500px]">
                        <LegisEditor initialContent={content} onChange={setContent} onEditorReady={setEditor} isNormative={isNormative} />
                    </div>
                    </div>
                </div>

                {isNormative && (
                    <div className="w-80 border-l overflow-y-auto">
                        <PropertiesPanel 
                            selectedElements={selectedElements} 
                            allElements={structuredElements} 
                            onUpdate={(updatedOrList: any) => {
                                const updates = Array.isArray(updatedOrList) ? updatedOrList : [updatedOrList];
                                
                                setStructuredElements(prev => {
                                    const newElements = prev.map(el => {
                                        const update = updates.find(u => u.id === el.id);
                                        return update ? update : el;
                                    });

                                    // Update selected elements to reflect current values in side panel
                                    setSelectedElements(prevSelected => 
                                        prevSelected.map(sel => {
                                            const update = updates.find(u => u.id === sel.id);
                                            return update ? update : sel;
                                        })
                                    );
                                    
                                    // Also update Editor if available
                                    if (editor) {
                                        const updateMap = new Map(updates.map(u => [u.id, u]));
                                        
                                        editor.state.doc.descendants((node, pos) => {
                                            const update = node.attrs?.normativeId ? updateMap.get(node.attrs.normativeId) : null;
                                            if (update) {
                                                // Correct Tiptap command to update attributes
                                                editor.commands.command(({ tr }) => {
                                                    tr.setNodeMarkup(pos, undefined, {
                                                        ...node.attrs,
                                                        type: update.type,
                                                        index: update.index,
                                                        specialSituations: update.specialSituations
                                                    });
                                                    return true;
                                                });
                                            }
                                            return true;
                                        });
                                    }
                                    
                                    return newElements;
                                });
                            }}
                            onSelectElements={setSelectedElements as any} 
                        />
                    </div>
                )}
            </div>

            <Dialog open={saveConfirmationOpen} onOpenChange={setSaveConfirmationOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Confirmar Salvamento</DialogTitle></DialogHeader>
                    <div className="py-4 text-sm text-muted-foreground">
                        {isNormative ? `Vigência automática: ${normativeData.publicationDate || 'não definida'}. Base: ${getLastElementDescription()}` : 'Deseja salvar esta coletânea?'}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSaveConfirmationOpen(false)}>Cancelar</Button>
                        <Button onClick={executeSave}>Confirmar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
