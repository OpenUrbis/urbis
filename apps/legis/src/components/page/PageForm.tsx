import React, { useState, useEffect, useMemo } from 'react';
import { 
    Button, Card, CardContent, Input, Separator,
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
    Switch, Label,
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@open-urbis/map-ui';
import { ArrowLeft, Save, Loader2, Tag, User, FileText, Book, Link as LinkIcon, Download, Globe, Lock, Folder, Plus, Search } from 'lucide-react';
import { CreatePageDto, Page, PageType } from '../../types/page';
import NovelEditorWrapper from '../Editor';
import { JSONContent, type Editor as TiptapEditor } from '@tiptap/core';
import { useAuth } from '@open-urbis/map-auth';
import { safeJSONParse } from '@/lib/content';
import { pageService } from '../../services/page-service';
import { categoryService, Category } from '../../services/category-service';
import { toast } from 'sonner';
import { RulesEngine } from '../../domain/rules-engine';
import { NormativeElement } from '../../domain/types';
import { PropertiesPanel } from './PropertiesPanel';
import { usePermission } from '../../hooks/use-permission';
import { useLocation } from 'wouter';
import { suggestionItems as defaultSuggestionItems } from '../Editor/slash-command';
import { useDebounce } from '@/hooks/use-debounce';

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
    const [type, setType] = useState<PageType>(initialData?.type || 'page');
    const [author, setAuthor] = useState(initialData?.author || auth.user?.profile.name || '');
    const [tagsInput, setTagsInput] = useState(initialData?.tags?.join(', ') || '');
    const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
    const [isPublic, setIsPublic] = useState(initialData?.isPublic ?? false);
    const [sourceUrl, setSourceUrl] = useState(initialData?.source?.url || '');
    const [sourceType, setSourceType] = useState<"html" | "pdf" | "location">(initialData?.source?.type || 'html');
    const [content, setContent] = useState<JSONContent | undefined>(
        initialData?.content ? safeJSONParse(initialData.content) : undefined
    );
    
    // Categories state
    const [categories, setCategories] = useState<Category[]>([]);

    // Editor instance state for programmatic updates
    const [editor, setEditor] = useState<TiptapEditor | null>(null);
    
    // Import state
    const [importOpen, setImportOpen] = useState(false);
    const [importUrl, setImportUrl] = useState('');
    const [importing, setImporting] = useState(false);

    // Link Dialog State
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [linkSearch, setLinkSearch] = useState('');
    const debouncedLinkSearch = useDebounce(linkSearch, 300);
    const [linkResults, setLinkResults] = useState<any[]>([]); // NormativeSearchResult[]
    const [linkLoading, setLinkLoading] = useState(false);

    // Parsing State
    const [selectedElement, setSelectedElement] = useState<NormativeElement | null>(null);
    const rulesEngine = useMemo(() => new RulesEngine(), []);

    // Custom Slash Commands
    const customSuggestionItems = useMemo(() => [
        ...defaultSuggestionItems,
        {
            title: "Vínculo",
            description: "Vincular a outro documento.",
            searchTerms: ["link", "vínculo", "referência"],
            icon: <LinkIcon size={18} />,
            command: ({ editor, range }: any) => {
                setLinkDialogOpen(true);
                editor.chain().focus().deleteRange(range).run();
            },
        }
    ], []);

    useEffect(() => {
        categoryService.getAll().then(setCategories);
    }, []);

    useEffect(() => {
        if (linkDialogOpen) {
            if (debouncedLinkSearch) {
                setLinkLoading(true);
                pageService.searchNormativeElements(debouncedLinkSearch)
                    .then(setLinkResults)
                    .finally(() => setLinkLoading(false));
            } else {
                setLinkResults([]);
            }
        }
    }, [linkDialogOpen, debouncedLinkSearch]);

    const handleCreateCategory = async () => {
        const name = window.prompt("Nome da nova categoria:");
        if (name) {
            try {
                const newCat = await categoryService.create(name);
                setCategories([...categories, newCat]);
                setCategoryId(newCat.id);
                toast.success("Categoria criada");
            } catch {
                toast.error("Erro ao criar categoria");
            }
        }
    };

    // Selection Update Logic
    useEffect(() => {
        if (editor && type === 'normative') {
            const updateHandler = () => {
                const { state } = editor;
                const { selection } = state;
                // Get the block node at selection
                const parent = state.doc.resolve(selection.from).parent;
                if (parent && parent.textContent) {
                     const parsed = rulesEngine.parseLine(parent.textContent);
                     // Construct NormativeElement (Mocking some fields)
                     const element: NormativeElement = {
                         id: 'temp-id',
                         type: parsed.type,
                         index: parsed.index,
                         text: parsed.content,
                         originalStartValidity: { date: '01.01.2024', deviceId: '1' }
                     };
                     setSelectedElement(element);
                } else {
                    setSelectedElement(null);
                }
            };
            
            editor.on('selectionUpdate', updateHandler);
            editor.on('update', updateHandler);
            
            return () => {
                editor.off('selectionUpdate', updateHandler);
                editor.off('update', updateHandler);
            };
        }
    }, [editor, type, rulesEngine]);

    // Initial load logic
    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title);
            setType(initialData.type);
            setAuthor(initialData.author);
            setTagsInput(initialData.tags?.join(', ') || '');
            setCategoryId(initialData.categoryId || '');
            setIsPublic(initialData.isPublic ?? false);
            if (initialData.source) {
                setSourceUrl(initialData.source.url);
                setSourceType(initialData.source.type);
            }
            if (initialData.content && !content) {
                 const parsed = safeJSONParse(initialData.content);
                 if (parsed) setContent(parsed);
                 else if (initialData.content.trim()) {
                     setContent({
                         type: 'doc',
                         content: [{ type: 'paragraph', content: [{ type: 'text', text: initialData.content }] }]
                     });
                 }
            }
        } else if (!author && auth.user?.profile.name) {
            setAuthor(auth.user.profile.name);
        }
    }, [initialData, auth.user]);

    const handleSubmit = async () => {
        if (!title.trim()) {
            toast.error('O título é obrigatório');
            return;
        }
        const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
        await onSubmit({ 
            title, 
            type,
            author,
            tags,
            categoryId,
            isPublic,
            source: sourceUrl ? { url: sourceUrl, type: sourceType } : undefined,
            content: JSON.stringify(content) 
        });
    };

    const handleImport = async () => {
        if (!importUrl) return;
        setImporting(true);
        try {
            const html = await pageService.importFromUrl(importUrl);
            if (editor) {
                // Insert content. If empty, replace. If not, append.
                if (editor.isEmpty) {
                    editor.commands.setContent(html);
                } else {
                    // Create a new paragraph before inserting to ensure separation
                    editor.chain().focus().createParagraphNear().insertContent(html).run();
                }
                
                toast.success("Conteúdo importado com sucesso. Revisão sugerida.");
                setImportOpen(false);
                setImportUrl('');
            } else {
                toast.error("Editor não inicializado.");
            }
        } catch (e) {
            console.error(e);
            toast.error("Erro ao importar URL.");
        } finally {
            setImporting(false);
        }
    };

    const handleInsertLink = (result: any) => {
        if (editor) {
            editor.chain().focus().insertContent({
                type: 'reference',
                attrs: {
                    pageId: result.pageId,
                    elementId: result.elementId
                }
            }).run();
            setLinkDialogOpen(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header / Actions */}
            <div className="sticky top-0 z-40 flex w-full items-center justify-between px-6 py-3 bg-background/80 backdrop-blur-sm border-b">
                <div className="flex items-center gap-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" onClick={onCancel}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-sm font-medium">{formTitle || (initialData ? 'Editando' : 'Novo Documento')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setImportOpen(true)} disabled={loading || importing} className="gap-2 text-muted-foreground">
                        <Download className="h-4 w-4" />
                        Importar
                    </Button>
                    <span className="text-xs text-muted-foreground mr-2 border-l pl-2 h-4 flex items-center">
                        {loading ? 'Salvando...' : 'Não salvo'}
                    </span>
                    <Button onClick={handleSubmit} disabled={loading} size="sm" className="gap-2">
                        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        Salvar
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden min-w-0">
                <div className="flex-1 overflow-y-auto min-w-0">
                    <div className="container max-w-4xl mx-auto px-8 py-12 space-y-8">
                        
                        {/* Title Area */}
                        <div className="space-y-4 group">
                            <textarea
                                placeholder="Título do Documento"
                                className="w-full text-5xl font-extrabold bg-transparent outline-none resize-none placeholder:text-muted-foreground/30 leading-tight"
                                rows={1}
                                value={title}
                                onChange={(e) => {
                                    setTitle(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                                onInput={(e: any) => {
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                                autoFocus
                                disabled={loading}
                            />
                            
                            {/* Metadata Grid (Compact 2-Column) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 items-start text-sm pt-2">
                                
                                {/* Left Column */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <User className="h-4 w-4" />
                                            <span>Autor</span>
                                        </div>
                                        <Input 
                                            value={author} 
                                            onChange={(e) => setAuthor(e.target.value)} 
                                            className="h-8 px-2 py-0 border-transparent hover:border-input focus:border-input bg-transparent w-full max-w-sm transition-all"
                                            placeholder="Nome do autor"
                                        />
                                    </div>

                                    <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            {type === 'page' ? <FileText className="h-4 w-4" /> : <Book className="h-4 w-4" />}
                                            <span>Tipo</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => setType('page')}
                                                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${type === 'page' ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
                                            >
                                                Página
                                            </button>
                                            <button 
                                                onClick={() => setType('normative')}
                                                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${type === 'normative' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'hover:bg-muted text-muted-foreground'}`}
                                            >
                                                Normativa
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Folder className="h-4 w-4" />
                                            <span>Categoria</span>
                                        </div>
                                        <div className="flex items-center gap-2 w-full">
                                            <Select value={categoryId} onValueChange={setCategoryId}>
                                                <SelectTrigger className="h-8 border-transparent hover:border-input bg-transparent px-2 text-xs w-full shadow-none">
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories.map(cat => (
                                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleCreateCategory}>
                                                <Plus className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Tag className="h-4 w-4" />
                                            <span>Tags</span>
                                        </div>
                                        <Input 
                                            value={tagsInput} 
                                            onChange={(e) => setTagsInput(e.target.value)} 
                                            className="h-8 px-2 py-0 border-transparent hover:border-input focus:border-input bg-transparent w-full transition-all"
                                            placeholder="Ex: urbano, lei..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            {isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                            <span>Visibilidade</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Switch checked={isPublic} onCheckedChange={setIsPublic} id="visibility-switch" className="scale-90" />
                                            <Label htmlFor="visibility-switch" className="text-xs font-normal cursor-pointer text-muted-foreground">
                                                {isPublic ? 'Pública' : 'Privada'}
                                            </Label>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <LinkIcon className="h-4 w-4" />
                                            <span>Fonte</span>
                                        </div>
                                        <div className="flex items-center gap-2 w-full">
                                            <Select value={sourceType} onValueChange={(v: any) => setSourceType(v)}>
                                                <SelectTrigger className="h-8 w-[80px] border-transparent hover:border-input bg-transparent px-2 text-xs shadow-none shrink-0">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="html">HTML</SelectItem>
                                                    <SelectItem value="pdf">PDF</SelectItem>
                                                    <SelectItem value="location">Local</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Input 
                                                value={sourceUrl} 
                                                onChange={(e) => setSourceUrl(e.target.value)} 
                                                className="h-8 px-2 py-0 border-transparent hover:border-input focus:border-input bg-transparent w-full"
                                                placeholder="URL da fonte"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="min-h-[500px]">
                            <NovelEditorWrapper
                                key={initialData?.id || 'new'} 
                                initialValue={content}
                                onChange={setContent}
                                editable={!loading}
                                onEditorReady={setEditor}
                                isNormative={type === 'normative'}
                                suggestionItems={customSuggestionItems}
                            />
                        </div>
                    </div>
                </div>

                {type === 'normative' && (
                    <div className="hidden md:block h-full border-l">
                        <PropertiesPanel element={selectedElement} rawNode={null} />
                    </div>
                )}
            </div>

            {/* Import Dialog */}
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Importar de URL</DialogTitle>
                        <DialogDescription>
                            Insira o link para importar o conteúdo. O texto será parseado e inserido no documento.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="relative">
                            <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                value={importUrl} 
                                onChange={(e) => setImportUrl(e.target.value)} 
                                placeholder="https://exemplo.com/documento"
                                className="pl-9"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setImportOpen(false)} disabled={importing}>Cancelar</Button>
                        <Button onClick={handleImport} disabled={!importUrl || importing}>
                            {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Importar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Link Dialog */}
            <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Inserir Vínculo</DialogTitle>
                        <DialogDescription>Selecione um documento para vincular.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                value={linkSearch} 
                                onChange={(e) => setLinkSearch(e.target.value)} 
                                placeholder="Buscar documentos..."
                                className="pl-9"
                            />
                        </div>
                        <div className="max-h-[300px] overflow-y-auto border rounded-md p-1 space-y-1 relative">
                            {linkLoading && <div className="p-4 flex justify-center"><Loader2 className="animate-spin h-4 w-4" /></div>}
                            {!linkLoading && linkResults.map(res => (
                                <div 
                                    key={res.elementId} 
                                    className="p-2 hover:bg-muted cursor-pointer rounded text-sm flex flex-col gap-1"
                                    onClick={() => handleInsertLink(res)}
                                >
                                    <div className="flex items-center gap-2 font-medium">
                                        <FileText className="h-3 w-3 text-muted-foreground" />
                                        <span>{res.pageTitle}</span>
                                        <span className="text-xs text-muted-foreground">({res.type} {res.index})</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground line-clamp-2 pl-5">
                                        {res.text}
                                    </div>
                                </div>
                            ))}
                            {!linkLoading && linkResults.length === 0 && debouncedLinkSearch && (
                                <div className="p-4 text-center text-xs text-muted-foreground">Nenhum resultado encontrado</div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
