import React, { useState, useMemo } from 'react';
import { Button, ScrollArea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Input, Textarea, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Badge, Separator, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, Tabs, TabsList, TabsTrigger, TabsContent } from '@open-urbis/map-ui';
import { Plus, X, AlertTriangle, Calendar, FileText, Bug, Search, Ban, ChevronDown, Check, Link as LinkIcon, Edit, MousePointerClick } from 'lucide-react';
import { NormativeElementEntity as NormativeElement, SpecialSituation, ElementType, CollectionLink } from '../../domain/entities';
import { format } from 'date-fns';
import NovelEditorWrapper from '../Editor';
import { validateElement } from '../../domain/normative-validation';
import { cn } from '@open-urbis/map-ui';
import { CollectionLinkManager } from '../collection/CollectionLinkManager';
import { getElementKey } from '../../domain/display-logic';
import { getCleanDisplayText } from '../../domain/text-utils';
import { SegmentSelector, Segment } from '../common/SegmentSelector';
import { extractTextFromWordIndices } from '../../domain/text-utils';
import { NormativeLinkInput } from '../common/NormativeLinkInput';

interface SpecialSituationsPanelProps {
    selectedElements?: NormativeElement[];
    allElements?: NormativeElement[];
    onUpdate: (element: NormativeElement | NormativeElement[]) => void;
    onSelectElements?: (elements: NormativeElement[]) => void;
}

const ELEMENT_TYPES: ElementType[] = [
    'Anexo', 'Parte', 'Livro', 'Título', 'Capítulo', 'Seção', 'Subseção',
    'Divisão desconforme', 'Artigo', 'Parágrafo', 'Inciso', 'Alínea',
    'Item', 'Elemento desconforme', 'Tabela', 'Figura', 'Mapa', 'Nota',
    'Introdução de decisão judicial', 'Ementa de decisão judicial',
    'Decisão judicial completa', 'Texto'
];

export function SpecialSituationsPanel({ selectedElements = [], allElements = [], onUpdate, onSelectElements }: SpecialSituationsPanelProps) {
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [debugOpen, setDebugOpen] = useState(false);
    const [newSituation, setNewSituation] = useState<Partial<SpecialSituation>>({ type: 'Veto' });
    const [searchTerm, setSearchTerm] = useState('');
    const [bulkType, setBulkType] = useState<ElementType | ''>('');
    const [bulkParentId, setBulkParentId] = useState<string>('');
    const [bulkValidity, setBulkValidity] = useState({
        initialDate: '', initialDevice: '', initialElementId: '',
        finalDate: '', finalDevice: '', finalElementId: ''
    });

    // Link Manager State
    const [linkManagerOpen, setLinkManagerOpen] = useState(false);
    const [activeLinkField, setActiveLinkField] = useState<string | null>(null);
    const [linkCache, setLinkCache] = useState<Record<string, { label: string }>>({});

    // Segment Selector State
    const [segmentSelectorOpen, setSegmentSelectorOpen] = useState(false);
    const [segmentContext, setSegmentContext] = useState<{ field: string, text: string } | null>(null);

    const handleOpenLinkManager = (field: string) => {
        setActiveLinkField(field);
        setLinkManagerOpen(true);
    };

    const handleOpenSegmentSelector = (field: string, text: string) => {
        setSegmentContext({ field, text });
        setSegmentSelectorOpen(true);
    };

    const handleSegmentConfirm = (segments: Segment[]) => {
        if (!segmentContext) return;
        
        const trechos = segments.map(s => ({ start: s.start, end: s.end }));
        // Join multiple segments with separator if needed, or just take first? 
        // User says "formado por um ou mais". And "separados por [...]".
        // SegmentSelector returns multiple? currently my UI does single, but I can support multiple later.
        // For now, let's assume one or join.
        
        // If we want to auto-fill text fields:
        const extractedText = segments.map(s => s.text).join(' [...] ');

        if (segmentContext.field === 'veto') {
             setNewSituation(prev => ({ 
                 ...prev, 
                 trechos, 
                 vetoText: extractedText 
             }));
        } else if (segmentContext.field.startsWith('startValidity')) {
             if (element) {
                 onUpdate({
                     ...element,
                     originalStartValidity: { ...element.originalStartValidity, trechos }
                 });
             }
        } else if (segmentContext.field.startsWith('endValidity')) {
             if (element && element.originalEndValidity) {
                 onUpdate({
                     ...element,
                     originalEndValidity: { ...element.originalEndValidity, trechos }
                 });
             }
        } else if (segmentContext.field === 'revocation') { // For other revocation types
             setNewSituation(prev => ({ 
                 ...prev, 
                 trechos, 
                 revokedText: extractedText
             }));
        }
    };

    const element = selectedElements.length === 1 ? selectedElements[0] : null;

    const handleLinkSelection = (links: CollectionLink[], cache: any) => {
        if (links.length > 0 && links[0].linkedElements && links[0].linkedElements.length > 0) {
            const selectedId = links[0].linkedElements[0].elementId;
            const docId = links[0].resourceId;
            
            // Generate label from cache
            const doc = cache[docId];
            let label = selectedId;
            if (doc) {
                const el = doc.elements?.find((e: any) => e.id === selectedId);
                const docLabel = doc.number ? `${doc.normativeType} ${doc.number}` : doc.ementa?.substring(0,20);
                if (el) {
                    label = `${docLabel} - ${el.type} ${el.index}`;
                } else {
                    label = docLabel;
                }
            }
            
            // Store label in local cache
            setLinkCache(prev => ({ ...prev, [selectedId]: { label } }));

            const valueToStore = selectedId;

            if (activeLinkField === 'bulkStart') {
                setBulkValidity(prev => ({ ...prev, initialElementId: valueToStore }));
            } else if (activeLinkField === 'bulkEnd') {
                setBulkValidity(prev => ({ ...prev, finalElementId: valueToStore }));
            } else if (activeLinkField === 'newSituation') {
                setNewSituation(prev => ({ ...prev, relatedDeviceId: valueToStore }));
            } else if (activeLinkField === 'startValidity' && element) {
                onUpdate({ 
                    ...element, 
                    originalStartValidity: { ...element.originalStartValidity, normativeElementId: valueToStore } 
                });
            } else if (activeLinkField === 'endValidity' && element && element.originalEndValidity) {
                onUpdate({ 
                    ...element, 
                    originalEndValidity: { ...element.originalEndValidity, normativeElementId: valueToStore } 
                });
            } else if (activeLinkField === 'parentId' && element) {
                onUpdate({ ...element, parentId: valueToStore });
            } else if (activeLinkField === 'bulkParentId') {
                setBulkParentId(valueToStore);
            }
        }
        setLinkManagerOpen(false);
    };


    const LocalElementSelector = ({ value, onChange, excludeId }: { value: string | undefined, onChange: (val: string) => void, excludeId?: string }) => {
        const [isOpen, setIsOpen] = useState(false);
        const [localSearch, setLocalSearch] = useState('');
        
        const selectedEl = allElements.find(e => e.id === value);
        const label = selectedEl ? `${selectedEl.type} ${selectedEl.index || ''}` : 'Nenhum (Raiz)';

        const filtered = useMemo(() => {
            if (!localSearch) return allElements;
            const lower = localSearch.toLowerCase();
            return allElements.filter(el => 
                el.type.toLowerCase().includes(lower) || 
                (el.index && el.index.toLowerCase().includes(lower)) || 
                (typeof el.text === 'string' && el.text.toLowerCase().includes(lower))
            );
        }, [allElements, localSearch]);

        return (
            <>
                <div 
                    className="flex items-center justify-between border rounded-md px-3 py-1.5 h-8 text-xs bg-background cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setIsOpen(true)}
                >
                    <span className="truncate">{label}</span>
                    <Search className="h-3 w-3 text-muted-foreground ml-2" />
                </div>

                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 gap-0">
                        <DialogHeader className="px-6 py-4 border-b">
                            <DialogTitle>Selecionar Elemento Pai</DialogTitle>
                        </DialogHeader>
                        
                        <div className="p-4 border-b bg-muted/10">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Buscar elementos..." 
                                    className="pl-9 bg-background"
                                    value={localSearch}
                                    onChange={e => setLocalSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="divide-y divide-border/50">
                                <div 
                                    className={cn(
                                        "p-4 cursor-pointer hover:bg-muted/50 transition-colors flex items-center gap-3",
                                        (!value || value === 'none') && "bg-primary/5"
                                    )}
                                    onClick={() => {
                                        onChange('none');
                                        setIsOpen(false);
                                    }}
                                >
                                    <div className={cn(
                                        "h-4 w-4 rounded-full border flex items-center justify-center shrink-0",
                                        (!value || value === 'none') ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                                    )}>
                                        {(!value || value === 'none') && <Check className="h-3 w-3" />}
                                    </div>
                                    <span className="font-medium text-sm">Nenhum (Raiz)</span>
                                </div>

                                {filtered.filter(el => el.id !== excludeId).map(el => {
                                    const isSelected = el.id === value;
                                    const prefix = getElementKey(el);
                                    const textContent = typeof el.text === 'string' ? el.text : 'Conteúdo Complexo';
                                    const fullHtml = textContent.trim().startsWith('<p>') 
                                        ? textContent.replace('<p>', `<p><span class="font-bold text-foreground mr-1">${prefix}</span>`) 
                                        : `<span class="font-bold text-foreground mr-1">${prefix}</span>${textContent}`;

                                    return (
                                        <div 
                                            key={el.id} 
                                            className={cn(
                                                "p-4 cursor-pointer hover:bg-muted/50 transition-colors flex items-start gap-3",
                                                isSelected && "bg-primary/5"
                                            )}
                                            onClick={() => {
                                                onChange(el.id);
                                                setIsOpen(false);
                                            }}
                                        >
                                            <div className={cn(
                                                "h-4 w-4 rounded-full border flex items-center justify-center shrink-0 mt-1",
                                                isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                                            )}>
                                                {isSelected && <Check className="h-3 w-3" />}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="font-mono text-[10px] font-normal">
                                                        {el.type}
                                                    </Badge>
                                                    <span className="font-mono text-sm font-medium text-primary">
                                                        {el.index}
                                                    </span>
                                                </div>
                                                <div 
                                                    className="text-sm text-muted-foreground prose prose-sm dark:prose-invert max-w-none"
                                                    dangerouslySetInnerHTML={{ __html: fullHtml }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                                
                                {filtered.length === 0 && (
                                    <div className="p-8 text-center text-muted-foreground">
                                        Nenhum elemento encontrado.
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </DialogContent>
                </Dialog>
            </>
        );
    };

    // Filter elements for the list view
    const filteredElements = useMemo(() => {
        if (!searchTerm) return allElements;
        const lower = searchTerm.toLowerCase();
        return allElements.filter(el => 
            el.type.toLowerCase().includes(lower) || 
            el.index?.toLowerCase().includes(lower) || 
            (typeof el.text === 'string' && el.text.toLowerCase().includes(lower))
        );
    }, [allElements, searchTerm]);

    // Actions
    const handleBulkTypeChange = (type: ElementType) => {
        const updates = selectedElements.map(el => ({ ...el, type }));
        onUpdate(updates);
        setBulkType('');
    };

    const handleBulkParentChange = (parentId: string) => {
        const pid = parentId === 'none' ? undefined : parentId;
        const updates = selectedElements.map(el => ({ ...el, parentId: pid }));
        onUpdate(updates);
        setBulkParentId('');
    };

    const handleBulkValidityApply = () => {
        const updates = selectedElements.map(el => {
            const up: any = {};
            if (bulkValidity.initialDate || bulkValidity.initialDevice || bulkValidity.initialElementId) {
                up.originalStartValidity = {
                    ...el.originalStartValidity,
                    ...(bulkValidity.initialDate ? { date: bulkValidity.initialDate } : {}),
                    ...(bulkValidity.initialDevice ? { deviceId: bulkValidity.initialDevice } : {}),
                    ...(bulkValidity.initialElementId ? { normativeElementId: bulkValidity.initialElementId } : {})
                };
            }
            if (bulkValidity.finalDate || bulkValidity.finalDevice || bulkValidity.finalElementId) {
                up.originalEndValidity = {
                    ...(el.originalEndValidity || { date: '', deviceId: '' }),
                    ...(bulkValidity.finalDate ? { date: bulkValidity.finalDate } : {}),
                    ...(bulkValidity.finalDevice ? { deviceId: bulkValidity.finalDevice } : {}),
                    ...(bulkValidity.finalElementId ? { normativeElementId: bulkValidity.finalElementId } : {})
                };
            }
            return { ...el, ...up };
        });
        
        onUpdate(updates);
        setBulkValidity({
            initialDate: '', initialDevice: '', initialElementId: '',
            finalDate: '', finalDevice: '', finalElementId: ''
        });
    };

    const handleBulkAddSituation = () => {
        if (!newSituation.type) return;
        const situation: SpecialSituation = {
            type: newSituation.type as any,
            date: newSituation.date || format(new Date(), 'dd.MM.yyyy'),
            relatedDeviceId: newSituation.relatedDeviceId,
            vetoText: newSituation.vetoText,
            newIndex: newSituation.newIndex,
            newText: newSituation.newText,
            dispositivo: newSituation.dispositivo,
            revokedText: newSituation.revokedText,
            vetoOverturnedText: newSituation.vetoOverturnedText,
            trechos: newSituation.trechos,
            newType: newSituation.newType,
        };

        const updates = selectedElements.map(el => ({
            ...el,
            specialSituations: [...(el.specialSituations || []), situation]
        }));
        
        onUpdate(updates);
        setAddDialogOpen(false);
        setNewSituation({ type: 'Veto' });
    };

    const handleAddSituation = () => {
        if (!element || !newSituation.type) return;
        
        const situation: SpecialSituation = {
            type: newSituation.type as any,
            date: newSituation.date || format(new Date(), 'dd.MM.yyyy'),
            relatedDeviceId: newSituation.relatedDeviceId,
            vetoText: newSituation.vetoText,
            newIndex: newSituation.newIndex,
            newText: newSituation.newText,
            dispositivo: newSituation.dispositivo,
            revokedText: newSituation.revokedText,
            vetoOverturnedText: newSituation.vetoOverturnedText,
            trechos: newSituation.trechos,
            newType: newSituation.newType,
        };

        const updatedElement = {
            ...element,
            specialSituations: [...(element.specialSituations || []), situation]
        };
        
        onUpdate(updatedElement);
        setAddDialogOpen(false);
        setNewSituation({ type: 'Veto' });
    };

    const handleRemoveSituation = (index: number) => {
        if (!element) return;
        const updatedSituations = [...element.specialSituations];
        updatedSituations.splice(index, 1);
        onUpdate({ ...element, specialSituations: updatedSituations });
    };

    // No Selection View
    if (selectedElements.length === 0) {
        return (
            <div className="w-80 border-l bg-background h-full flex flex-col">
                <div className="p-4 border-b bg-muted/10">
                    <h3 className="text-sm font-semibold mb-3">Navegação</h3>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar elementos..." 
                            className="pl-9 h-9 bg-background"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <ScrollArea className="flex-1">
                    <div className="divide-y divide-border/50">
                        {filteredElements.map(el => {
                            const errors = validateElement(el);
                            const prefix = getElementKey(el);
                            const cleanText = getCleanDisplayText(typeof el.text === 'string' ? el.text : '', el.type, el.index);

                            const isSelected = selectedElements.some(s => s.id === el.id);
                            return (
                                <div 
                                    key={el.id} 
                                    className={cn(
                                        "p-3 hover:bg-muted/50 cursor-pointer transition-colors group",
                                        isSelected && "bg-primary/10 border-r-2 border-primary"
                                    )}
                                    onClick={() => onSelectElements?.([el])}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="font-mono text-[10px] font-normal text-muted-foreground group-hover:text-foreground">
                                                {el.type}
                                            </Badge>
                                            <span className="font-mono text-sm font-medium text-primary">
                                                {el.index}
                                            </span>
                                        </div>
                                        {errors.length > 0 && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                                    </TooltipTrigger>
                                                    <TooltipContent className="text-xs bg-amber-50 text-amber-900 border-amber-200">
                                                        {errors.length} problemas encontrados
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </div>
                                    <div 
                                        className="text-xs text-muted-foreground line-clamp-2 pl-1 border-l-2 border-transparent group-hover:border-primary/20 prose prose-xs dark:prose-invert max-w-none [&>p]:m-0 [&>p]:inline"
                                    >
                                        <span className="font-bold text-foreground mr-1">{prefix}</span>
                                        <span dangerouslySetInnerHTML={{ __html: cleanText }} />
                                    </div>
                                </div>
                            );
                        })}
                        {filteredElements.length === 0 && (
                            <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                                <Search className="h-8 w-8 opacity-20" />
                                <span>Nenhum elemento encontrado.</span>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        );
    }

    // Bulk Selection View
    if (selectedElements.length > 1) {
        return (
            <div className="w-80 border-l bg-background h-full flex flex-col">
                <div className="p-4 border-b flex justify-between items-center bg-muted/20">
                    <span className="text-sm font-semibold">{selectedElements.length} itens selecionados</span>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onSelectElements?.([])} title="Fechar Seleção">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                
                <div className="p-4 space-y-6">
                    <div className="space-y-3 p-3 bg-muted/10 rounded-md border">
                        <Label className="text-xs font-semibold">Definir Tipo em Massa</Label>
                        <Select 
                            value={bulkType} 
                            onValueChange={(v) => handleBulkTypeChange(v as ElementType)}
                        >
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                {ELEMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3 p-3 bg-muted/10 rounded-md border">
                        <Label className="text-xs font-semibold">Definir Elemento Pai em Massa</Label>
                        <LocalElementSelector
                            value={bulkParentId} 
                            onChange={val => handleBulkParentChange(val)} 
                        />
                    </div>

                    <div className="space-y-3 p-3 bg-muted/10 rounded-md border">
                        <Label className="text-xs font-semibold mb-2">Definir Vigência em Massa</Label>
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground uppercase">Vigência Inicial</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input 
                                        placeholder="Data" 
                                        className="h-7 text-xs" 
                                        value={bulkValidity.initialDate}
                                        onChange={e => setBulkValidity({...bulkValidity, initialDate: e.target.value})}
                                    />
                                    <Input 
                                        placeholder="Norma" 
                                        className="h-7 text-xs"
                                        value={bulkValidity.initialDevice}
                                        onChange={e => setBulkValidity({...bulkValidity, initialDevice: e.target.value})}
                                    />
                                </div>
                                <NormativeLinkInput 
                                    value={bulkValidity.initialElementId} 
                                    onChange={val => setBulkValidity({...bulkValidity, initialElementId: val})} 
                                    onOpen={() => handleOpenLinkManager("bulkStart")}
                                    label={linkCache[bulkValidity.initialElementId]?.label}
                                />
                            </div>
                            <Separator />
                            <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground uppercase">Vigência Final</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input 
                                        placeholder="Data" 
                                        className="h-7 text-xs"
                                        value={bulkValidity.finalDate}
                                        onChange={e => setBulkValidity({...bulkValidity, finalDate: e.target.value})}
                                    />
                                    <Input 
                                        placeholder="Norma" 
                                        className="h-7 text-xs"
                                        value={bulkValidity.finalDevice}
                                        onChange={e => setBulkValidity({...bulkValidity, finalDevice: e.target.value})}
                                    />
                                </div>
                                <NormativeLinkInput 
                                    value={bulkValidity.finalElementId} 
                                    onChange={val => setBulkValidity({...bulkValidity, finalElementId: val})} 
                                    onOpen={() => handleOpenLinkManager("bulkEnd")}
                                    label={linkCache[bulkValidity.finalElementId]?.label}
                                />
                            </div>
                            <Button size="sm" className="w-full h-7 text-xs" variant="secondary" onClick={handleBulkValidityApply}>
                                Aplicar Vigência
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-3 p-3 bg-muted/10 rounded-md border">
                        <Label className="text-xs font-semibold">Adicionar Situação em Massa</Label>
                        <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => setAddDialogOpen(true)}>
                            <Plus className="h-3 w-3 mr-2" /> Adicionar Situação
                        </Button>
                    </div>

                    <div className="text-xs text-muted-foreground italic">
                        As ações aplicadas aqui afetarão todos os {selectedElements.length} elementos selecionados.
                    </div>
                </div>

                {/* Reusing Add Dialog for Bulk */}
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Adicionar Situação em Massa</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Tipo</Label>
                                <Select 
                                    value={newSituation.type} 
                                    onValueChange={(v) => setNewSituation({ ...newSituation, type: v as any })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Veto">Veto</SelectItem>
                                        <SelectItem value="Revogação">Revogação</SelectItem>
                                        <SelectItem value="Nova redação">Nova Redação</SelectItem>
                                        <SelectItem value="Renumeração">Renumeração</SelectItem>
                                        <SelectItem value="Suspensão de vigor/eficácia">Suspensão</SelectItem>
                                        <SelectItem value="Vigência inicial alterada">Alteração de Vigência</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Data</Label>
                                    <Input 
                                        placeholder="DD.MM.YYYY" 
                                        value={newSituation.date || ''}
                                        onChange={e => setNewSituation({...newSituation, date: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Dispositivo Relacionado (ID)</Label>
                                    <NormativeLinkInput 
                                        value={newSituation.relatedDeviceId || ''} 
                                        onChange={val => setNewSituation({...newSituation, relatedDeviceId: val})} 
                                        onOpen={() => handleOpenLinkManager("newSituation")}
                                        label={linkCache[newSituation.relatedDeviceId || '']?.label}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleBulkAddSituation}>Aplicar em {selectedElements.length} Itens</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    // Single Selection View
    if (!element) return null; // Should not happen given checks above

    const validationErrors = validateElement(element);

    return (
        <div className="w-80 border-l bg-background h-full flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-muted/20">
                <span className="text-sm font-semibold truncate flex-1">
                    {element.type} {element.index}
                </span>
                <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" onClick={() => setDebugOpen(true)} title="Debug JSON">
                        <Bug className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setAddDialogOpen(true)} title="Adicionar Situação">
                        <Plus className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onSelectElements?.([])} title="Fechar Seleção">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
                <Tabs defaultValue="details" className="flex-1 flex flex-col">
                    <div className="px-4 pt-2">
                        <TabsList className="w-full grid grid-cols-2">
                            <TabsTrigger value="details">Detalhes</TabsTrigger>
                            <TabsTrigger value="situations">Situações</TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-hidden relative">
                        <TabsContent value="details" className="absolute inset-0 overflow-y-auto p-4 space-y-6">
                            {/* Element Editing */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Classificação</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Tipo</Label>
                                            <Select 
                                                value={element.type} 
                                                onValueChange={(v) => {
                                                    const newType = v as ElementType;
                                                    const updates: any = { type: newType };
                                                    if (newType === 'Tabela' || newType === 'Figura' || newType === 'Mapa') {
                                                        updates.index = '';
                                                    }
                                                    onUpdate({ ...element, ...updates });
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {ELEMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {!['Tabela', 'Figura', 'Mapa'].includes(element.type) && (
                                            <div className="space-y-1">
                                                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Índice</Label>
                                                <Input 
                                                    value={element.index || ''} 
                                                    onChange={(e) => onUpdate({ ...element, index: e.target.value })}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Parent Selection */}
                                <div className="space-y-2">
                                    <Label className="text-xs">Elemento Pai</Label>
                                    <LocalElementSelector 
                                        value={element.parentId || ''} 
                                        onChange={val => onUpdate({ ...element, parentId: val })} 
                                        excludeId={element.id}
                                    />
                                    {element.parentId && (
                                        <div className="text-[10px] text-muted-foreground px-1">
                                            ID: <span className="font-mono">{element.parentId}</span>
                                        </div>
                                    )}
                                </div>

                                {validationErrors.length > 0 && (
                                    <div className="bg-amber-50 text-amber-900 p-3 rounded-md text-xs border border-amber-200 shadow-sm">
                                        <div className="flex items-center gap-2 mb-2 font-semibold">
                                            <AlertTriangle className="h-3.5 w-3.5" />
                                            Atenção
                                        </div>
                                        <ul className="list-disc pl-4 space-y-1">
                                            {validationErrors.map((err, i) => (
                                                <li key={i}>{err.message}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <Separator />

                                {/* Original Start Validity */}
                                <div className="space-y-3">
                                    <Label className="text-xs font-semibold">Vigência Inicial Original (*)</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-muted-foreground">Data / Condição</Label>
                                            <Input 
                                                value={element.originalStartValidity?.date || ''} 
                                                onChange={(e) => onUpdate({ 
                                                    ...element, 
                                                    originalStartValidity: { ...element.originalStartValidity, date: e.target.value } 
                                                })}
                                                placeholder="DD.MM.YYYY ou texto"
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-muted-foreground">Dispositivo</Label>
                                            <Input 
                                                value={element.originalStartValidity?.deviceId || ''} 
                                                onChange={(e) => onUpdate({ 
                                                    ...element, 
                                                    originalStartValidity: { ...element.originalStartValidity, deviceId: e.target.value } 
                                                })}
                                                placeholder="Ex: Lei nº X"
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-1">
                                            <Label className="text-[10px] text-muted-foreground">ID Elemento Normativo</Label>
                                            <NormativeLinkInput 
                                                value={element.originalStartValidity?.normativeElementId || ''} 
                                                onChange={val => onUpdate({ 
                                                    ...element, 
                                                    originalStartValidity: { ...element.originalStartValidity, normativeElementId: val } 
                                                })} 
                                                onOpen={() => handleOpenLinkManager("startValidity")}
                                                label={linkCache[element.originalStartValidity?.normativeElementId || '']?.label}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Original End Validity (Optional) */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-xs font-semibold">Vigência Final Original (Opcional)</Label>
                                        {!element.originalEndValidity && (
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-5 text-[10px]"
                                                onClick={() => onUpdate({ 
                                                    ...element, 
                                                    originalEndValidity: { date: '', deviceId: '' } 
                                                })}
                                            >
                                                <Plus className="w-3 h-3 mr-1" /> Adicionar
                                            </Button>
                                        )}
                                    </div>
                                    
                                    {element.originalEndValidity && (
                                        <div className="grid grid-cols-2 gap-3 relative border p-2 rounded-md bg-muted/10">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="absolute -top-2 -right-2 h-5 w-5 bg-background border shadow-sm hover:text-destructive"
                                                onClick={() => onUpdate({ ...element, originalEndValidity: undefined })}
                                            >
                                                <X className="w-3 h-3" />
                                            </Button>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] text-muted-foreground">Data / Condição</Label>
                                                <Input 
                                                    value={element.originalEndValidity.date} 
                                                    onChange={(e) => onUpdate({ 
                                                        ...element, 
                                                        originalEndValidity: { ...element.originalEndValidity!, date: e.target.value } 
                                                    })}
                                                    placeholder="DD.MM.YYYY"
                                                    className="h-8 text-xs"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] text-muted-foreground">Dispositivo</Label>
                                                <Input 
                                                    value={element.originalEndValidity.deviceId} 
                                                    onChange={(e) => onUpdate({ 
                                                        ...element, 
                                                        originalEndValidity: { ...element.originalEndValidity!, deviceId: e.target.value } 
                                                    })}
                                                    placeholder="Ex: Lei nº Y"
                                                    className="h-8 text-xs"
                                                />
                                            </div>
                                            <div className="col-span-2 space-y-1">
                                                <Label className="text-[10px] text-muted-foreground">ID Elemento Normativo</Label>
                                                <NormativeLinkInput 
                                                    value={element.originalEndValidity.normativeElementId || ''} 
                                                    onChange={val => onUpdate({ 
                                                        ...element, 
                                                        originalEndValidity: { ...element.originalEndValidity!, normativeElementId: val } 
                                                    })} 
                                                    onOpen={() => handleOpenLinkManager("endValidity")}
                                                    label={linkCache[element.originalEndValidity.normativeElementId || '']?.label}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="situations" className="absolute inset-0 overflow-y-auto p-4 space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="text-xs font-semibold">Lista de Situações ({element.specialSituations?.length || 0})</Label>
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAddDialogOpen(true)}>
                                    <Plus className="h-3 w-3 mr-1" /> Adicionar
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {element.specialSituations?.map((sit, idx) => (
                                    <div key={idx} className="relative group p-3 border rounded-md hover:border-primary/50 transition-colors bg-card shadow-sm">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                                            onClick={() => handleRemoveSituation(idx)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                        
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="secondary" className="font-normal">
                                                {sit.type}
                                            </Badge>
                                        </div>
                                        
                                        <div className="space-y-1.5 text-xs text-muted-foreground">
                                            <div className="flex gap-2 items-center">
                                                <Calendar className="h-3.5 w-3.5" />
                                                <span>{sit.date || 'Data não informada'}</span>
                                            </div>
                                            {sit.relatedDeviceId && (
                                                <div className="flex gap-2 items-center">
                                                    <FileText className="h-3.5 w-3.5" />
                                                    <span className="font-mono bg-muted px-1 rounded">{sit.relatedDeviceId}</span>
                                                </div>
                                            )}
                                            {sit.dispositivo && (
                                                <div className="text-[10px] text-muted-foreground italic">
                                                    <span className="font-semibold mr-1 not-italic">Dispositivo:</span>
                                                    "{sit.dispositivo}"
                                                </div>
                                            )}
                                            {sit.vetoText && (
                                                <div className="mt-2 bg-destructive/5 text-destructive p-2 rounded border border-destructive/10">
                                                    <div className="font-semibold text-[10px] uppercase mb-1">Texto Vetado</div>
                                                    "{sit.vetoText}"
                                                </div>
                                            )}
                                            {sit.newText && (
                                                <div className="mt-2 bg-blue-50 text-blue-700 p-2 rounded border border-blue-100">
                                                    <div className="font-semibold text-[10px] uppercase mb-1">Nova Redação</div>
                                                    "{sit.newText}"
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                
                                {(!element.specialSituations || element.specialSituations.length === 0) && (
                                    <div className="flex flex-col items-center justify-center py-12 text-xs text-muted-foreground border-2 border-dashed rounded-md bg-muted/5">
                                        <Ban className="h-8 w-8 opacity-20 mb-2" />
                                        <span>Nenhuma situação especial registrada.</span>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </div>

            {/* Add Dialog */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adicionar Situação Especial</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select 
                                value={newSituation.type} 
                                onValueChange={(v) => setNewSituation({ ...newSituation, type: v as any })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Vigência inicial alterada">Vigência Inicial Alterada</SelectItem>
                                    <SelectItem value="Vigência final alterada">Vigência Final Alterada</SelectItem>
                                    <SelectItem value="Alteração de ementa">Alteração de Ementa</SelectItem>
                                    <SelectItem value="Veto">Veto</SelectItem>
                                    <SelectItem value="Derrubada de veto">Derrubada de Veto</SelectItem>
                                    <SelectItem value="Renumeração">Renumeração</SelectItem>
                                    <SelectItem value="Nova redação">Nova Redação</SelectItem>
                                    <SelectItem value="Perda definitiva de vigor/eficácia">Perda Definitiva de Vigor/Eficácia</SelectItem>
                                    <SelectItem value="Suspensão de vigor/eficácia">Suspensão de Vigor/Eficácia</SelectItem>
                                    <SelectItem value="Revogação">Revogação</SelectItem>
                                    <SelectItem value="Anulação">Anulação</SelectItem>
                                    <SelectItem value="Cassação">Cassação</SelectItem>
                                    <SelectItem value="Restauração de vigor/eficácia">Restauração de Vigor/Eficácia</SelectItem>
                                    <SelectItem value="Interpretação conforme à Constituição">Interpretação Conforme à Constituição</SelectItem>
                                    <SelectItem value="Declaração de inconstitucionalidade sem redução de texto">Declaração de Inconstitucionalidade sem Redução</SelectItem>
                                    <SelectItem value="Acréscimo">Acréscimo</SelectItem>
                                    <SelectItem value="Repristinação">Repristinação</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Common Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Dispositivo</Label>
                                <Input 
                                    placeholder="Ex: Art. 1º da Lei X"
                                    value={newSituation.dispositivo || ''}
                                    onChange={e => setNewSituation({...newSituation, dispositivo: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>ID Elemento Relacionado</Label>
                                <NormativeLinkInput 
                                    value={newSituation.relatedDeviceId || ''} 
                                    onChange={val => setNewSituation({...newSituation, relatedDeviceId: val})} 
                                    onOpen={() => handleOpenLinkManager("newSituation")}
                                    label={linkCache[newSituation.relatedDeviceId || '']?.label}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Data</Label>
                            <Input 
                                placeholder="DD.MM.YYYY ou 'vigência condicionada'" 
                                value={newSituation.date || ''}
                                onChange={e => setNewSituation({...newSituation, date: e.target.value})}
                            />
                        </div>

                        {/* Specific Fields Logic */}
                        
                        {(newSituation.type === 'Veto') && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label>Texto Vetado (se parcial)</Label>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-5 text-[10px]"
                                        onClick={() => handleOpenSegmentSelector('veto', element?.text || '')}
                                    >
                                        <MousePointerClick className="w-3 h-3 mr-1" /> Selecionar Trechos
                                    </Button>
                                </div>
                                <Textarea 
                                    value={newSituation.vetoText || ''}
                                    onChange={e => setNewSituation({...newSituation, vetoText: e.target.value})}
                                />
                                {newSituation.trechos && newSituation.trechos.length > 0 && (
                                    <div className="text-[10px] text-muted-foreground">
                                        {newSituation.trechos.length} trecho(s) vinculado(s) via índice de palavras.
                                    </div>
                                )}
                            </div>
                        )}

                        {(newSituation.type === 'Derrubada de veto') && (
                            <div className="space-y-2">
                                <Label>Texto com Veto Derrubado (se parcial)</Label>
                                <Textarea 
                                    value={newSituation.vetoOverturnedText || ''}
                                    onChange={e => setNewSituation({...newSituation, vetoOverturnedText: e.target.value})}
                                />
                            </div>
                        )}

                        {(newSituation.type === 'Nova redação' || 
                          newSituation.type === 'Alteração de ementa' || 
                          newSituation.type === 'Acréscimo' || 
                          newSituation.type === 'Interpretação conforme à Constituição' ||
                          newSituation.type === 'Declaração de inconstitucionalidade sem redução de texto') && (
                            <div className="space-y-2">
                                <Label>Novo Texto / Texto Alterado</Label>
                                <Textarea 
                                    value={newSituation.newText || ''}
                                    onChange={e => setNewSituation({...newSituation, newText: e.target.value})}
                                />
                            </div>
                        )}

                        {(newSituation.type === 'Perda definitiva de vigor/eficácia' ||
                          newSituation.type === 'Suspensão de vigor/eficácia' ||
                          newSituation.type === 'Revogação' ||
                          newSituation.type === 'Anulação' ||
                          newSituation.type === 'Cassação') && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label>Texto sem Vigor/Eficácia (se parcial)</Label>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-5 text-[10px]"
                                        onClick={() => handleOpenSegmentSelector('revocation', element?.text || '')}
                                    >
                                        <MousePointerClick className="w-3 h-3 mr-1" /> Selecionar Trechos
                                    </Button>
                                </div>
                                <Textarea 
                                    value={newSituation.revokedText || ''}
                                    onChange={e => setNewSituation({...newSituation, revokedText: e.target.value})}
                                />
                            </div>
                        )}

                        {newSituation.type === 'Vigência inicial alterada' && (
                            <div className="space-y-2">
                                <div className="bg-muted/30 p-2 rounded text-xs border mb-2">
                                    <p className="text-muted-foreground">
                                        Use para definir a vigência inicial específica deste elemento, caso difira da vigência original da norma.
                                    </p>
                                </div>
                            </div>
                        )}

                        {newSituation.type === 'Renumeração' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Novo Índice</Label>
                                    <Input 
                                        value={newSituation.newIndex || ''}
                                        onChange={e => setNewSituation({...newSituation, newIndex: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Novo Tipo</Label>
                                    <Select 
                                        value={newSituation.newType} 
                                        onValueChange={(v) => setNewSituation({ ...newSituation, newType: v as ElementType })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {ELEMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleAddSituation}>Adicionar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <CollectionLinkManager 
                open={linkManagerOpen} 
                onOpenChange={setLinkManagerOpen}
                initialLinks={[]} // Always start empty for single selection search
                onSave={(links, cache) => handleLinkSelection(links, cache)}
                selectionMode="single"
            />

            <SegmentSelector 
                open={segmentSelectorOpen}
                onOpenChange={setSegmentSelectorOpen}
                text={segmentContext?.text || ''}
                onConfirm={handleSegmentConfirm}
                title="Selecionar Trechos do Dispositivo"
            />

            {/* Debug Dialog */}
            <Dialog open={debugOpen} onOpenChange={setDebugOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Debug: Element JSON</DialogTitle>
                    </DialogHeader>
                    <div className="bg-muted p-4 rounded-md overflow-auto max-h-[500px]">
                        <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                            {JSON.stringify(element, null, 2)}
                        </pre>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(element, null, 2));
                            setDebugOpen(false);
                        }}>Copiar JSON</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
