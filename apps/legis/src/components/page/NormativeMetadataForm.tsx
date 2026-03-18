import React, { useState, useEffect, useMemo } from 'react';
import { 
    Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Label, 
    Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
    Textarea, Separator, Card, CardContent, Badge, Switch
} from '@open-urbis/map-ui';
import { Plus, Trash2, AlertCircle, PlusCircle, Calendar as CalendarIcon, Check, ExternalLink, Sparkles, X, Loader2, MousePointerClick, FileText, Edit, Link as LinkIcon, Search } from 'lucide-react';
import { format, parse, isValid, isAfter, isBefore, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { OriginalNormativo, Authority, EmentaAlteration, CollectionLink } from '../../domain/entities';
import { NORMATIVE_TYPES, NormativeTypeKey } from '../../data/normative-types';
import { AUTHORITIES } from '../../data/authorities';
import { NormativeSocialBanner } from './NormativeSocialBanner';
import { LegisEditor } from '../Editor/LegisEditor';
import { SimpleEditor } from '../Editor/SimpleEditor';
import { safeJSONParse } from '@/lib/content';
import { JSONContent } from '@tiptap/core';
import { SegmentSelector, Segment } from '../common/SegmentSelector';
import { extractTextFromWordIndices } from '../../domain/text-utils';
import { pageService } from '../../services/page-service';
import { CollectionLinkManager } from '../collection/CollectionLinkManager';
import { NormativeLinkInput } from '../common/NormativeLinkInput';
import { DatePartsInput } from '../common/DatePartsInput';

// ==========================================
// Authority Dialog Component
// ==========================================

interface AuthorityDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (authority: Authority) => void;
}

function AuthorityDialog({ open, onOpenChange, onSave }: AuthorityDialogProps) {
    const [formData, setFormData] = useState<Partial<Authority>>({
        startDate: '',
        commonRefFull: '',
        commonRefAbbr: ''
    });

    const isValid = useMemo(() => {
        return formData.commonRefFull && formData.commonRefAbbr && formData.startDate;
    }, [formData]);

    const handleSubmit = () => {
        if (!isValid) return;
        
        const newAuth: Authority = {
            id: Math.floor(Math.random() * 90000 + 10000).toString(), // Mock ID generation (ex: 32154)
            commonRefFull: formData.commonRefFull!,
            commonRefAbbr: formData.commonRefAbbr!,
            complementFull: formData.complementFull,
            complementAbbr: formData.complementAbbr,
            startDate: formData.startDate!,
            endDate: formData.endDate,
            pageId: formData.pageId
        };
        
        onSave(newAuth);
        onOpenChange(false);
        setFormData({ startDate: '', commonRefFull: '', commonRefAbbr: '' });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Cadastrar Nova Autoridade</DialogTitle>
                </DialogHeader>
                
                <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-2 col-span-2">
                        <Label>Referência Comum - Por Extenso (*)</Label>
                        <Input 
                            value={formData.commonRefFull || ''} 
                            onChange={e => setFormData({...formData, commonRefFull: e.target.value})} 
                            placeholder="Ex: República Federativa do Brasil"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Referência Comum - Abreviação (*)</Label>
                        <Input 
                            value={formData.commonRefAbbr || ''} 
                            onChange={e => setFormData({...formData, commonRefAbbr: e.target.value})} 
                            placeholder="Ex: BRASIL"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>ID (Automático)</Label>
                        <Input disabled placeholder="Gerado pelo sistema" />
                    </div>

                    <div className="space-y-2 col-span-2">
                        <Label>Complemento - Por Extenso</Label>
                        <Input 
                            value={formData.complementFull || ''} 
                            onChange={e => setFormData({...formData, complementFull: e.target.value})} 
                            placeholder="Ex: Ministério da Fazenda"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Complemento - Abreviação</Label>
                        <Input 
                            value={formData.complementAbbr || ''} 
                            onChange={e => setFormData({...formData, complementAbbr: e.target.value})} 
                            placeholder="Ex: MF"
                        />
                    </div>

                    <div className="col-span-2 grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label>Data Início (*)</Label>
                            <DatePartsInput 
                                value={formData.startDate} 
                                onChange={v => setFormData({...formData, startDate: v})} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Data Fim</Label>
                            <DatePartsInput 
                                value={formData.endDate} 
                                onChange={v => setFormData({...formData, endDate: v})} 
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2 col-span-2">
                        <Label>ID da Página (Legis)</Label>
                        <Input 
                            value={formData.pageId || ''} 
                            onChange={e => setFormData({...formData, pageId: e.target.value})} 
                            placeholder="Opcional"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={!isValid}>Salvar Autoridade</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ==========================================
// Main Form Component
// ==========================================

interface NormativeMetadataFormProps {
    data: Partial<OriginalNormativo>;
    onChange: (data: Partial<OriginalNormativo>) => void;
    disabled?: boolean;
}

export function NormativeMetadataForm({ data, onChange, disabled, title, onTitleChange }: NormativeMetadataFormProps & { title?: string, onTitleChange?: (v: string) => void }) {
    const [authorities, setAuthorities] = useState<Authority[]>(AUTHORITIES);
    const [isAuthDialogOpen, setAuthDialogOpen] = useState(false);
    const [showBanner, setShowBanner] = useState(false);

    // Segment Selector State
    const [segmentSelectorOpen, setSegmentSelectorOpen] = useState(false);
    const [segmentContext, setSegmentContext] = useState<{ type: 'source' | 'target', index: number, text: string } | null>(null);
    const [loadingText, setLoadingText] = useState(false);

    // Link Manager State
    const [linkManagerOpen, setLinkManagerOpen] = useState(false);
    const [activeLinkIndex, setActiveLinkIndex] = useState<number | null>(null);
    const [linkCache, setLinkCache] = useState<Record<string, { label: string }>>({});
    
    // Derived State
    const selectedAuthority = authorities.find(a => a.id === data.authorityId);
    
    // Validation Logic
    const isDateValidForAuthority = useMemo(() => {
        if (!data.actDate || !selectedAuthority) return true;
        
        try {
            const actDate = parse(data.actDate, 'dd.MM.yyyy', new Date());
            const authStart = parse(selectedAuthority.startDate, 'dd.MM.yyyy', new Date());
            
            if (isBefore(actDate, authStart)) return false;
            
            if (selectedAuthority.endDate) {
                const authEnd = parse(selectedAuthority.endDate, 'dd.MM.yyyy', new Date());
                if (isAfter(actDate, authEnd)) return false;
            }
            
            return true;
        } catch (e) {
            return false;
        }
    }, [data.actDate, selectedAuthority]);

    const isMinimumRequirementMet = useMemo(() => {
        return !!(data.number || data.actDate || data.publicationDate);
    }, [data.number, data.actDate, data.publicationDate]);

    // Handlers
    const handleAddAuthority = (newAuth: Authority) => {
        setAuthorities([...authorities, newAuth]);
        onChange({ ...data, authorityId: newAuth.id });
    };

    const handleAddAlteration = () => {
        const newAlt: EmentaAlteration = {
            type: 'Alteração de ementa',
            device: '',
            normativeElementId: '',
            targetSegments: []
        };
        onChange({ 
            ...data, 
            ementaAlterations: [...(data.ementaAlterations || []), newAlt] 
        });
    };

    const handleRemoveAlteration = (index: number) => {
        const newAlts = [...(data.ementaAlterations || [])];
        newAlts.splice(index, 1);
        onChange({ ...data, ementaAlterations: newAlts });
    };

    const handleUpdateAlteration = (index: number, field: keyof EmentaAlteration, value: any) => {
        const newAlts = [...(data.ementaAlterations || [])];
        newAlts[index] = { ...newAlts[index], [field]: value };
        onChange({ ...data, ementaAlterations: newAlts });
    };

    const handleAddSource = () => {
        onChange({ 
            ...data, 
            sources: [...(data.sources || []), { url: '', name: '' }] 
        });
    };

    const handleUpdateSource = (index: number, field: 'url' | 'name', value: string) => {
        const newSources = [...(data.sources || [])];
        newSources[index] = { ...newSources[index], [field]: value };
        onChange({ ...data, sources: newSources });
    };

    const handleRemoveSource = (index: number) => {
        const newSources = [...(data.sources || [])];
        newSources.splice(index, 1);
        onChange({ ...data, sources: newSources });
    };

    const handleOpenLinkManager = (index: number) => {
        setActiveLinkIndex(index);
        setLinkManagerOpen(true);
    };

    const handleLinkSelection = (links: CollectionLink[], cache: any) => {
        if (activeLinkIndex === null) return;
        
        if (links.length > 0 && links[0].linkedElements && links[0].linkedElements.length > 0) {
            const selectedId = links[0].linkedElements[0].elementId;
            const docId = links[0].resourceId;
            
            // Generate label
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
            setLinkCache(prev => ({ ...prev, [selectedId]: { label } }));

            handleUpdateAlteration(activeLinkIndex, 'normativeElementId', selectedId);
        }
        setLinkManagerOpen(false);
    };

    const handleOpenSourceSegments = async (index: number) => {
        const alt = data.ementaAlterations?.[index];
        if (!alt || !alt.normativeElementId) {
            alert("Preencha o ID do Elemento Normativo primeiro.");
            return;
        }

        setLoadingText(true);
        try {
            // We need to find the element. Since we don't have a direct API to get element text by ID efficiently without page context,
            // we might need to search or assume it's in the system.
            // PageService.getById gets a PAGE. If ID is an element ID, we need to find the page it belongs to?
            // Or assume ID is Page ID?
            // "ID de Elemento normativo" usually implies the element UUID.
            // If we use the global search to find the element?
            // Let's try to fetch by ID if it matches a Page (unlikely for element) or search.
            
            // For now, let's look up in the mock/cache if possible, or use a placeholder if not found.
            // In a real app, we'd have `elementService.getById`.
            // Let's assume we can search for it.
            
            // Temporary: Use pageService to search for element ID?
            // Or assume the user linked a Page ID?
            // If the user inputs a UUID, we might not be able to resolve it easily without a backend index.
            
            // Fallback: Ask user to paste text? No, that defeats the purpose.
            // Let's try to search by elementId in all pages (inefficient but works for mocks).
            
            const allPages = await pageService.getAll();
            let foundText = '';
            
            for (const page of allPages) {
                if (page.type === 'original_normativo' && page.entity) {
                    const norm = page.entity as OriginalNormativo;
                    const el = norm.elements.find(e => e.id === alt.normativeElementId);
                    if (el) {
                        foundText = el.text;
                        break;
                    }
                }
            }
            
            if (foundText) {
                setSegmentContext({ type: 'source', index, text: foundText });
                setSegmentSelectorOpen(true);
            } else {
                alert("Elemento não encontrado no sistema. Verifique o ID.");
            }
        } catch (e) {
            console.error(e);
            alert("Erro ao buscar texto do elemento.");
        } finally {
            setLoadingText(false);
        }
    };

    const handleOpenTargetSegments = (index: number) => {
        if (!data.ementa) {
            alert("Preencha a Ementa primeiro.");
            return;
        }
        setSegmentContext({ type: 'target', index, text: data.ementa });
        setSegmentSelectorOpen(true);
    };

    const handleSegmentConfirm = (segments: Segment[]) => {
        if (!segmentContext) return;
        
        const newAlts = [...(data.ementaAlterations || [])];
        const alt = newAlts[segmentContext.index];
        
        if (segmentContext.type === 'source') {
            // Update sourceSegments
            const sourceSegments = segments.map(s => ({
                start: s.start,
                end: s.end,
                changedText: s.text // Raw text
            }));
            
            // Generate New Ementa Content (stripping quotes)
            const extractedText = segments.map(s => extractTextFromWordIndices(segmentContext.text, s.start, s.end, true)).join(' [...] ');
            
            // We set it as "changedText" of the first segment? Or where do we store the full text?
            // The requirement says "Texto alterado: [obrigatório]".
            // But EmentaAlteration struct has sourceSegments (array).
            // Maybe we populate the first segment's text with the full text?
            // Or maybe we need a separate field for "New Text derived"?
            // EmentaAlteration interface has `sourceSegments`.
            // Let's update the first segment's `changedText` to be the processed one, or just store raw.
            // Wait, "O conteúdo de cada versão alterada de Ementa é dado pelos trechos...".
            // So we don't store a separate string, we derive it.
            // BUT UI has "Texto alterado" input.
            // Let's auto-fill the input if it exists in the UI?
            // My previous UI implementation for EmentaAlteration had `sourceSegments` list with `changedText`.
            // It seems `changedText` in `sourceSegments` is per-segment.
            
            // Let's update `sourceSegments` with the extracted (and quote-stripped) text.
            const updatedSegments = segments.map(s => ({
                start: s.start,
                end: s.end,
                changedText: extractTextFromWordIndices(segmentContext.text, s.start, s.end, true)
            }));
            
            alt.sourceSegments = updatedSegments;
            
        } else {
            // Update targetSegments
            const targetSegments = segments.map(s => ({
                start: s.start,
                end: s.end
            }));
            alt.targetSegments = targetSegments;
        }
        
        newAlts[segmentContext.index] = alt;
        onChange({ ...data, ementaAlterations: newAlts });
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Banner Toggle */}
            <div className="flex justify-end items-center gap-2 mb-4">
                <Label htmlFor="banner-mode" className="text-xs font-medium text-muted-foreground flex items-center gap-1 cursor-pointer">
                    <Sparkles className="w-3 h-3 text-yellow-500" />
                    Modo Divulgação
                </Label>
                <Switch 
                    id="banner-mode" 
                    checked={showBanner} 
                    onCheckedChange={setShowBanner} 
                    className="scale-75"
                />
            </div>

            {/* Social Banner */}
            {showBanner && (
                <NormativeSocialBanner 
                    data={data} 
                    authority={selectedAuthority} 
                    onClose={() => setShowBanner(false)}
                />
            )}

            {/* Header / Errors */}
            {!isMinimumRequirementMet && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-center text-sm">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    É obrigatório preencher pelo menos um dos campos: Número, Data do Ato ou Data de Publicação.
                </div>
            )}

            {/* Main Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                
                {/* Tipo Normativo */}
                <div className="space-y-2">
                    <Label>Tipo Normativo</Label>
                    <Select
                        value={data.normativeType}
                        onValueChange={(v) => onChange({ ...data, normativeType: v as NormativeTypeKey })}
                        disabled={disabled}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            {Object.entries(NORMATIVE_TYPES).map(([key, label]) => (
                                <SelectItem key={key} value={key}>
                                    {label} ({key})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Número */}
                <div className="space-y-2">
                    <Label>Número da norma</Label>
                    <Input
                        value={data.number || ''}
                        onChange={(e) => onChange({ ...data, number: e.target.value })}
                        placeholder="Ex: 12.345-A"
                        disabled={disabled}
                    />
                    <p className="text-[10px] text-muted-foreground">Pode conter pontuação e letras.</p>
                </div>

                {/* Data do Ato */}
                <div className="space-y-2">
                    <Label>Data do Ato</Label>
                    <DatePartsInput 
                        value={data.actDate} 
                        onChange={v => onChange({ ...data, actDate: v })}
                        maxYear={new Date().getFullYear() + 1}
                        disabled={disabled}
                    />
                    {!isDateValidForAuthority && (
                        <p className="text-[10px] text-destructive mt-1">
                            Data incompatível com a vigência da Autoridade selecionada.
                        </p>
                    )}
                </div>

                {/* Data de Publicação */}
                <div className="space-y-2">
                    <Label>Data de Publicação</Label>
                    <DatePartsInput 
                        value={data.publicationDate} 
                        onChange={v => onChange({ ...data, publicationDate: v })}
                        maxYear={new Date().getFullYear()}
                        disabled={disabled}
                    />
                </div>

                {/* Autoridade */}
                <div className="col-span-1 md:col-span-2 space-y-2">
                    <div className="flex justify-between items-center">
                        <Label>Autoridade (*)</Label>
                        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setAuthDialogOpen(true)}>
                            <PlusCircle className="w-3 h-3 mr-1" /> Nova Autoridade
                        </Button>
                    </div>
                    <Select
                        value={data.authorityId}
                        onValueChange={(v) => onChange({ ...data, authorityId: v })}
                        disabled={disabled}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione a autoridade..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            {authorities.map(auth => (
                                <SelectItem key={auth.id} value={auth.id}>
                                    <span className="font-medium">{auth.commonRefAbbr}</span>
                                    {auth.complementAbbr && <span className="text-muted-foreground"> - {auth.complementAbbr}</span>}
                                    <span className="text-muted-foreground text-xs ml-2">
                                        ({auth.complementFull || auth.commonRefFull})
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {selectedAuthority && (
                        <div className="text-xs text-muted-foreground flex gap-4 mt-1">
                            <span>Vigência: {selectedAuthority.startDate} até {selectedAuthority.endDate || 'Presente'}</span>
                            {selectedAuthority.pageId && (
                                <span className="flex items-center text-primary cursor-pointer hover:underline">
                                    <ExternalLink className="w-3 h-3 mr-1" /> Ver página da autoridade
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Nome/Título Amigável */}
                <div className="col-span-1 md:col-span-2 space-y-2">
                    <Label>Nome Amigável / Título</Label>
                    <Input
                        value={title || ''}
                        onChange={(e) => onTitleChange?.(e.target.value)}
                        placeholder="Ex: Lei de Zoneamento"
                        disabled={disabled}
                        className="font-medium"
                    />
                    <p className="text-[10px] text-muted-foreground">Este título é sincronizado com o campo principal no topo da página.</p>
                </div>

                {/* Ementa */}
                <div className="col-span-1 md:col-span-2 space-y-2">
                    <Label>Ementa (*)</Label>
                    <Textarea
                        value={data.ementa || ''}
                        onChange={(e) => onChange({ ...data, ementa: e.target.value })}
                        className="min-h-[80px]"
                        placeholder="Digite a ementa da norma..."
                        disabled={disabled}
                    />
                </div>
            </div>

            <Separator />

            {/* Alterações de Ementa */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Alterações de Ementa</h3>
                    <Button variant="outline" size="sm" onClick={handleAddAlteration}>
                        <Plus className="w-4 h-4 mr-2" /> Adicionar Alteração
                    </Button>
                </div>
                
                {data.ementaAlterations?.map((alt, index) => (
                    <Card key={index} className="bg-muted/30">
                        <CardContent className="p-4 space-y-4 relative">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={() => handleRemoveAlteration(index)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Dispositivo (*)</Label>
                                    <Input 
                                        value={alt.device} 
                                        onChange={e => handleUpdateAlteration(index, 'device', e.target.value)}
                                        placeholder="Ex: Art. 1º"
                                        className="h-8"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">ID Elemento Normativo (*)</Label>
                                    <NormativeLinkInput 
                                        value={alt.normativeElementId || ''} 
                                        onChange={val => handleUpdateAlteration(index, 'normativeElementId', val)} 
                                        onOpen={() => handleOpenLinkManager(index)}
                                        label={alt.normativeElementId ? linkCache[alt.normativeElementId]?.label : undefined}
                                        placeholder="Vincular elemento"
                                    />
                                </div>
                            </div>
                            
                            {/* Source Segments (Trechos com Texto Alterado) */}
                            <div className="space-y-2 border rounded-md p-2 bg-background/50">
                                <div className="flex justify-between items-center">
                                    <Label className="text-xs font-semibold">Trechos (Texto Alterado) [Opcional]</Label>
                                    <div className="flex gap-2">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-5 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50" 
                                            onClick={() => handleOpenSourceSegments(index)}
                                            disabled={loadingText}
                                        >
                                            {loadingText ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <MousePointerClick className="w-3 h-3 mr-1" />}
                                            Selecionar da Fonte
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-5 text-[10px]" onClick={() => {
                                            const newSegs = [...(alt.sourceSegments || []), { start: 0, end: 0, changedText: '' }];
                                            handleUpdateAlteration(index, 'sourceSegments', newSegs);
                                        }}>
                                            <Plus className="w-3 h-3 mr-1" /> Manual
                                        </Button>
                                    </div>
                                </div>
                                {alt.sourceSegments?.map((seg: any, sIdx: number) => (
                                    <div key={sIdx} className="grid grid-cols-[1fr_80px_80px_24px] gap-2 items-start">
                                        <Input 
                                            value={seg.changedText || ''} 
                                            onChange={e => {
                                                const newSegs = [...(alt.sourceSegments || [])];
                                                newSegs[sIdx] = { ...seg, changedText: e.target.value };
                                                handleUpdateAlteration(index, 'sourceSegments', newSegs);
                                            }}
                                            placeholder="Texto alterado"
                                            className="h-7 text-xs"
                                        />
                                        <Input 
                                            type="number"
                                            value={seg.start} 
                                            onChange={e => {
                                                const newSegs = [...(alt.sourceSegments || [])];
                                                newSegs[sIdx] = { ...seg, start: parseInt(e.target.value) || 0 };
                                                handleUpdateAlteration(index, 'sourceSegments', newSegs);
                                            }}
                                            placeholder="Início"
                                            className="h-7 text-xs"
                                        />
                                        <Input 
                                            type="number"
                                            value={seg.end} 
                                            onChange={e => {
                                                const newSegs = [...(alt.sourceSegments || [])];
                                                newSegs[sIdx] = { ...seg, end: parseInt(e.target.value) || 0 };
                                                handleUpdateAlteration(index, 'sourceSegments', newSegs);
                                            }}
                                            placeholder="Fim"
                                            className="h-7 text-xs"
                                        />
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                            onClick={() => {
                                                const newSegs = [...(alt.sourceSegments || [])];
                                                newSegs.splice(sIdx, 1);
                                                handleUpdateAlteration(index, 'sourceSegments', newSegs);
                                            }}
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            {/* Target Segments (Trechos Alvo) */}
                            <div className="space-y-2 border rounded-md p-2 bg-background/50">
                                <div className="flex justify-between items-center">
                                    <Label className="text-xs font-semibold">Trechos (Alvos na Ementa) [Obrigatório]</Label>
                                    <div className="flex gap-2">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-5 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50" 
                                            onClick={() => handleOpenTargetSegments(index)}
                                        >
                                            <MousePointerClick className="w-3 h-3 mr-1" /> Selecionar na Ementa
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-5 text-[10px]" onClick={() => {
                                            const newSegs = [...(alt.targetSegments || []), { start: 0, end: 0 }];
                                            handleUpdateAlteration(index, 'targetSegments', newSegs);
                                        }}>
                                            <Plus className="w-3 h-3 mr-1" /> Manual
                                        </Button>
                                    </div>
                                </div>
                                {alt.targetSegments?.map((seg, tIdx) => (
                                    <div key={tIdx} className="grid grid-cols-[1fr_1fr_24px] gap-2 items-start">
                                        <div className="flex items-center gap-2">
                                            <Label className="text-[10px] text-muted-foreground w-8">Início:</Label>
                                            <Input 
                                                type="number"
                                                value={seg.start} 
                                                onChange={e => {
                                                    const newSegs = [...(alt.targetSegments || [])];
                                                    newSegs[tIdx] = { ...seg, start: parseInt(e.target.value) || 0 };
                                                    handleUpdateAlteration(index, 'targetSegments', newSegs);
                                                }}
                                                className="h-7 text-xs"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Label className="text-[10px] text-muted-foreground w-8">Fim:</Label>
                                            <Input 
                                                type="number"
                                                value={seg.end} 
                                                onChange={e => {
                                                    const newSegs = [...(alt.targetSegments || [])];
                                                    newSegs[tIdx] = { ...seg, end: parseInt(e.target.value) || 0 };
                                                    handleUpdateAlteration(index, 'targetSegments', newSegs);
                                                }}
                                                className="h-7 text-xs"
                                            />
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                            onClick={() => {
                                                const newSegs = [...(alt.targetSegments || [])];
                                                newSegs.splice(tIdx, 1);
                                                handleUpdateAlteration(index, 'targetSegments', newSegs);
                                            }}
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </div>
                                ))}
                                {(!alt.targetSegments || alt.targetSegments.length === 0) && (
                                    <p className="text-[10px] text-destructive italic">Nenhum trecho alvo definido.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Separator />

            {/* Preâmbulo e Assinatura */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Preâmbulo</Label>
                    <SimpleEditor
                        key={data.id ? `preamble-${data.id}` : 'preamble-new'}
                        initialContent={data.preamble ? (data.preamble.startsWith('{') ? (safeJSONParse(data.preamble) || data.preamble) : data.preamble) : undefined}
                        onChange={(content) => onChange({ ...data, preamble: content })}
                        readOnly={disabled}
                        className="prose-sm"
                        placeholder="O Presidente da República..."
                        outputFormat="html"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Assinatura</Label>
                    <SimpleEditor
                        key={data.id ? `signature-${data.id}` : 'signature-new'}
                        initialContent={data.signature ? (data.signature.startsWith('{') ? (safeJSONParse(data.signature) || data.signature) : data.signature) : undefined}
                        onChange={(content) => onChange({ ...data, signature: content })}
                        readOnly={disabled}
                        className="prose-sm text-right"
                        placeholder="Nome do Signatário..."
                        outputFormat="html"
                    />
                </div>
            </div>

            <Separator />

            {/* Fontes */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Fontes</h3>
                    <Button variant="outline" size="sm" onClick={handleAddSource}>
                        <Plus className="w-4 h-4 mr-2" /> Adicionar Fonte
                    </Button>
                </div>

                {data.sources?.map((source, index) => (
                    <div key={index} className="flex gap-2 items-start">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-1">
                            <Input 
                                value={source.url} 
                                onChange={e => handleUpdateSource(index, 'url', e.target.value)}
                                placeholder="URL da Fonte (*)"
                                className="h-8"
                            />
                            <Input 
                                value={source.name || ''} 
                                onChange={e => handleUpdateSource(index, 'name', e.target.value)}
                                placeholder="Nome da Fonte (Opcional)"
                                className="h-8"
                            />
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveSource(index)}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                ))}
                {(!data.sources || data.sources.length === 0) && (
                    <p className="text-sm text-muted-foreground italic">Nenhuma fonte cadastrada.</p>
                )}
            </div>

            <AuthorityDialog 
                open={isAuthDialogOpen} 
                onOpenChange={setAuthDialogOpen} 
                onSave={handleAddAuthority} 
            />

            <SegmentSelector
                open={segmentSelectorOpen}
                onOpenChange={setSegmentSelectorOpen}
                text={segmentContext?.text || ''}
                onConfirm={handleSegmentConfirm}
                title={segmentContext?.type === 'source' ? "Selecionar Trechos da Nova Redação" : "Selecionar Trechos a Substituir"}
            />

            <CollectionLinkManager 
                open={linkManagerOpen} 
                onOpenChange={setLinkManagerOpen}
                initialLinks={[]} 
                onSave={handleLinkSelection}
                selectionMode="single"
            />
        </div>
    );
}
