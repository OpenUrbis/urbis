import React, { useMemo, useState } from 'react';
import { OriginalNormativo, NormativeElementEntity } from '../../domain/entities';
import { TableData, MapData, FigureData } from '../../domain/types';
import { AUTHORITIES } from '../../data/authorities';
import { NORMATIVE_TYPES } from '../../data/normative-types';
import { format, parse, isValid, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getElementKey } from '../../domain/display-logic';
import { getCleanDisplayText } from '../../domain/text-utils';
import { cn } from '@open-urbis/map-ui';
import { Separator, Sheet, SheetContent, SheetHeader, SheetTitle } from '@open-urbis/map-ui';
import { groupSituationsForElement, isValidityNotStarted, isValidityEnded, getElementStyle } from './SituationLogic';
import { SituationCard } from './SituationCard';
import { processElementsForConsolidated, ViewMode, isFutureValidity } from './ConsolidationLogic';
import { processGaps, GapItem } from './GapLogic';
import { SmartTableRenderer } from './SmartTableRenderer';
import { Layers } from 'lucide-react';

export interface LinkedCollectionInfo {
    id: string;
    title: string;
    elementIds: string[];
}

interface NormativeDocumentRendererProps {
    data: OriginalNormativo;
    viewMode?: ViewMode;
    linkedCollections?: Record<string, LinkedCollectionInfo[]>;
    onSelectElement?: (element: NormativeElementEntity) => void;
}

export function NormativeDocumentRenderer({ 
    data, 
    viewMode = 'full', 
    linkedCollections = {},
    onSelectElement
}: NormativeDocumentRendererProps) {
    const authority = useMemo(() => AUTHORITIES.find(a => a.id === data.authorityId), [data.authorityId]);
    const normativeTypeLabel = useMemo(
        () => NORMATIVE_TYPES[data.normativeType] ?? data.normativeType,
        [data.normativeType]
    );

    const visibleElements = useMemo(() => {
        let elements = viewMode === 'full' ? (data.elements || []) : processElementsForConsolidated(data.elements || []);
        
        // Deduplication logic: Hide "Texto" elements that match the title of a subsequent "Tabela", "Figura", or "Mapa"
        return elements.filter((el, idx) => {
            if (el.type === 'Texto') {
                const nextEl = elements[idx + 1];
                if (nextEl && ['Tabela', 'Figura', 'Mapa'].includes(nextEl.type)) {
                    const cleanText = el.text?.replace(/<[^>]*>/g, '').trim();
                    const cleanNextTitle = nextEl.text?.replace(/<[^>]*>/g, '').trim();
                    if (cleanText === cleanNextTitle) return false;
                }
            }
            return true;
        });
    }, [data.elements, viewMode]);

    const { preAnexoElements, postAnexoElements, tableElements } = useMemo(() => {
        const allExceptTables = visibleElements.filter(el => el.type !== 'Tabela');
        const tables = visibleElements.filter(el => el.type === 'Tabela');
        
        const idx = allExceptTables.findIndex(el => el.type === 'Anexo');
        if (idx === -1) return { preAnexoElements: allExceptTables, postAnexoElements: [], tableElements: tables };
        return { 
            preAnexoElements: allExceptTables.slice(0, idx), 
            postAnexoElements: allExceptTables.slice(idx),
            tableElements: tables 
        };
    }, [visibleElements]);

    const preAnexoWithGaps = useMemo(() => processGaps(preAnexoElements), [preAnexoElements]);
    const postAnexoWithGaps = useMemo(() => processGaps(postAnexoElements), [postAnexoElements]);

    const noteMap = useMemo(() => {
        const map = new Map<string, string[]>();
        data.elements?.forEach(el => {
            if (el.type === 'Nota' && el.noteData) {
                el.noteData.forEach(nd => {
                    const existing = map.get(nd.targetElementId) || [];
                    existing.push(el.index || '');
                    map.set(nd.targetElementId, existing);
                });
            }
        });
        return map;
    }, [data.elements]);

    const formatDate = (dateStr?: string, full: boolean = false) => {
        if (!dateStr) return 'sem data';
        try {
            const parsed = parse(dateStr, 'dd.MM.yyyy', new Date());
            if (!isValid(parsed)) return dateStr;
            if (full) return format(parsed, "d 'de' MMMM 'de' yyyy", { locale: ptBR }).toUpperCase();
            return format(parsed, 'dd.MM.yyyy');
        } catch { return dateStr; }
    };

    const Epigrafe = () => (
        <div className="uppercase font-bold text-center text-sm tracking-wide mb-6">
            {normativeTypeLabel}
            {data.number && <span> Nº {data.number}</span>}
            {<span>, DE {formatDate(data.actDate || data.publicationDate, true)}</span>}
        </div>
    );

    const Ficha = () => (
        <div className="col-span-full bg-muted/10 p-4 rounded-md border text-xs mb-8">
            <div className="font-bold mb-2 uppercase text-[10px] tracking-widest text-muted-foreground underline">Ficha:</div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
                <div><span className="font-bold">ID:</span> {data.id}</div>
                <div><span className="font-bold">Autoridade:</span> {authority?.commonRefAbbr || data.authorityId}</div>
                <div><span className="font-bold">Data do ato:</span> {formatDate(data.actDate)}</div>
                <div><span className="font-bold">Data de publicação:</span> {formatDate(data.publicationDate)}</div>
                <div className="w-full"><span className="font-bold">Ementa:</span> “{data.ementa}”</div>
                <div><span className="font-bold">Nome:</span> {(data as any).name || 'sem nome'}</div>
                <div><span className="font-bold">Fontes:</span> {data.sources?.map((s, i) => (
                    <React.Fragment key={i}>
                        {i > 0 && "; "}
                        <a href={s.url} target="_blank" className="text-primary hover:underline">{s.name || `Link ${i+1}`}</a>
                    </React.Fragment>
                )) || 'sem fontes'}</div>
            </div>
        </div>
    );

    return (
        <div className="relative min-h-full">
            <div className="font-serif text-foreground/90 leading-relaxed text-justify grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-x-12 relative z-10 items-start py-12 pl-8 xl:pl-12">
                
                {/* Header Section */}
                    <header className="col-start-1 min-w-0 mb-12 pr-4 xl:pr-8">
                    <Epigrafe />
                    <div className="flex mb-8">
                        <div className="w-1/2 ml-auto text-justify text-sm font-bold uppercase" dangerouslySetInnerHTML={{ __html: data.ementa || '' }} />
                    </div>
                    {data.preamble && (
                        <div className="text-sm mb-8 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: data.preamble }} />
                    )}
                </header>
                <div className="hidden xl:block col-start-2" />

                {preAnexoWithGaps.map((item, idx) => {
                    if (item.type === 'Gap') return <GapRow key={`pre-${item.id}-${idx}`} />;
                    const el = item as NormativeElementEntity;
                    return <ElementRow key={`pre-${el.id}-${idx}`} element={el} noteMap={noteMap} viewMode={viewMode} linkedCollections={linkedCollections} onSelect={onSelectElement} />;
                })}

                {data.signature && (
                    <>
                        <div className="col-start-1 min-w-0 mb-12 text-right italic pr-12 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: data.signature }} />
                        <div className="hidden xl:block col-start-2" />
                    </>
                )}

                {postAnexoElements.length > 0 && (
                    <>
                        <div className="col-start-1 min-w-0 pr-4 xl:pr-8">
                            <Separator className="my-8 h-[2px] bg-foreground/20" />
                            <div className="font-bold uppercase text-center mb-8">Anexos</div>
                        </div>
                        <div className="hidden xl:block col-start-2" />
                        
                {postAnexoWithGaps.map((item, idx) => {
                    if (item.type === 'Gap') return <GapRow key={`post-${item.id}-${idx}`} />;
                    const el = item as NormativeElementEntity;
                    return <ElementRow key={`post-${el.id}-${idx}`} element={el} noteMap={noteMap} viewMode={viewMode} linkedCollections={linkedCollections} onSelect={onSelectElement} />;
                })}
                    </>
                )}

                {tableElements.length > 0 && (
                    <>
                        <div className="col-start-1 min-w-0 pr-4 xl:pr-8">
                            <Separator className="my-16 h-[2px] bg-foreground/20" />
                            <div className="font-bold uppercase text-center mb-12 text-lg tracking-widest">Tabelas</div>
                        </div>
                        <div className="hidden xl:block col-start-2" />
                        
                        {tableElements.map((el, idx) => (
                            <ElementRow key={`table-${el.id}-${idx}`} element={el} noteMap={noteMap} viewMode={viewMode} linkedCollections={linkedCollections} onSelect={onSelectElement} />
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}

export function ElementRow({ 
    element, 
    noteMap, 
    viewMode = 'full',
    linkedCollections,
    onSelect
}: { 
    element: NormativeElementEntity, 
    noteMap: Map<string, string[]>, 
    viewMode?: ViewMode,
    linkedCollections?: Record<string, LinkedCollectionInfo[]>,
    onSelect?: (element: NormativeElementEntity) => void
}) {
    const [sheetOpen, setSheetOpen] = useState(false);
    const groups = useMemo(() => groupSituationsForElement(element), [element]);
    const visibleGroups = useMemo(() => viewMode === 'full' ? groups : groups.filter(g => g.situations.some(s => isFutureValidity(s))), [groups, viewMode]);
    const links = linkedCollections?.[element.id];
    const isLinked = links && links.length > 0;
    const isStructural = ['Parte', 'Livro', 'Título', 'Capítulo', 'Seção', 'Subseção', 'Divisão desconforme', 'Anexo'].includes(element.type);
    const topOffset = isStructural ? 'top-10' : 'top-3';

    return (
        <React.Fragment>
            <div id={`el-${element.id}`} className={cn("col-start-1 min-w-0 relative group pr-4 xl:pr-8 transition-colors duration-200", isLinked && "bg-primary/5 rounded-md -mx-4 px-4 py-1 -my-1")}>
                {isLinked && (
                    <div className="absolute -left-8 top-1 cursor-pointer text-primary opacity-50 hover:opacity-100 flex items-center justify-center w-6 h-6 rounded-full hover:bg-primary/10 transition-all" onClick={() => setSheetOpen(true)}>
                        <Layers className="h-4 w-4" />
                    </div>
                )}
                <ElementContent element={element} noteMap={noteMap} viewMode={viewMode} onSelect={() => onSelect?.(element)} />
                <div className="xl:hidden mt-2 ml-4 border-l-2 border-primary/20 pl-4 space-y-2">
                     {visibleGroups.map(g => <SituationCard key={g.id} group={g} />)}
                </div>
            </div>

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent side="left" className="w-[400px]">
                    <SheetHeader><SheetTitle>Coletâneas Vinculadas</SheetTitle></SheetHeader>
                    <div className="py-6 space-y-4">
                        {links?.map(col => (
                            <div key={col.id} className="border p-4 rounded-md hover:bg-muted/50 transition-colors bg-card text-sm">
                                <div className="font-medium mb-1">{col.title}</div>
                                <div className="text-xs text-muted-foreground">ID: {col.id.substring(0,8)}</div>
                            </div>
                        ))}
                    </div>
                </SheetContent>
            </Sheet>

            <div className="hidden xl:flex col-start-2 flex-col gap-4 pt-0">
                 {visibleGroups.map(group => (
                     <div key={group.id} className="relative">
                         <div className={`absolute ${topOffset} -left-16 w-16 h-px bg-slate-300 dark:bg-slate-700`} />
                         <div className={`absolute ${topOffset} -left-16 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 -translate-x-1/2 -translate-y-1/2`} />
                         <SituationCard group={group} />
                     </div>
                 ))}
            </div>
        </React.Fragment>
    );
}

export function ElementContent({ 
    element, 
    noteMap, 
    viewMode = 'full',
    onSelect
}: { 
    element: NormativeElementEntity, 
    noteMap: Map<string, string[]>, 
    viewMode?: ViewMode,
    onSelect?: () => void
}) {
    const { type, index, text, tableData, figureData, mapData, specialSituations, originalEndValidity } = element;
    const safeIndex = typeof index === 'string' ? index.trim() : index != null ? String(index) : '';
    if ((type as string) === 'Separator') return <div className="text-center text-muted-foreground my-4 font-mono text-sm tracking-widest">[...]</div>;

    const isFuture = isValidityNotStarted(element);
    const isExpired = isValidityEnded(element, originalEndValidity);
    const isRevoked = specialSituations?.some(s => ['Revogação', 'Anulação', 'Cassação', 'Perda definitiva de vigor/eficácia', 'Suspensão de vigor/eficácia'].includes(s.type));
    const isRepristinated = specialSituations?.some(s => s.type === 'Repristinação');

    let key = getElementKey(element);
    if (type === 'Parágrafo') key = (safeIndex === 'único' || text?.toLowerCase().startsWith('único')) ? 'Parágrafo único - ' : (safeIndex ? `§ ${getElementKey({ ...element, type: 'Parágrafo', text: undefined }).replace(/^§\s*/, '').trim()} - ` : '');
    else if (type === 'Inciso' || type === 'Item') key = safeIndex ? `${safeIndex} - ` : '';
    else if (type === 'Alínea') key = safeIndex ? `${safeIndex}) ` : '';
    else if (type === 'Nota') key = safeIndex ? `(${safeIndex}) - ` : '';

    const isUppercase = ['Parte', 'Livro', 'Título', 'Capítulo', 'Anexo', 'Epígrafe'].includes(type);
    const isCentered = ['Parte', 'Livro', 'Título', 'Capítulo', 'Seção', 'Subseção', 'Divisão desconforme', 'Anexo'].includes(type);
    
    let displayText = text;
    if (viewMode === 'consolidated' && displayText?.includes('(VETADO)')) displayText = displayText.replace(/\(VETADO\)/g, '[...]');
    
    const notes = noteMap.get(element.id);
    const noteSuperscript = notes ? notes.map(n => <sup key={n} className="ml-0.5 text-[10px] font-bold text-primary">({n})</sup>) : null;

    const finalDisplayText = getCleanDisplayText(displayText || '', type, index);

    if (isCentered) return <div className={cn("mb-6 mt-8 font-bold", isCentered && "text-center", isUppercase && "uppercase")}>{key}<span dangerouslySetInnerHTML={{ __html: finalDisplayText }} />{noteSuperscript}</div>;

    const indentClass = type === 'Parágrafo' || type === 'Inciso' ? 'pl-8' : type === 'Alínea' ? 'pl-16' : type === 'Item' ? 'pl-24' : '';
    let keyDisplay: React.ReactNode = <span className="font-bold">{key}</span>;
    const renumSit = specialSituations?.find(s => s.type === 'Renumeração');
    if (renumSit && renumSit.newIndex) keyDisplay = <><span className="line-through font-normal text-muted-foreground">{key}</span><span className="text-blue-900 ml-1">{renumSit.newType || type} {renumSit.newIndex} - </span></>;

    if (['Tabela', 'Figura', 'Mapa'].includes(type)) return (
        <div id={`el-${element.id}`} className="my-8 scroll-mt-20">
            <div className="font-bold mb-4 text-base border-b pb-2 flex items-center gap-2 text-primary">
                <span className="bg-primary/10 px-2 py-0.5 rounded text-xs uppercase tracking-wider">{type} {index || ''}</span>
                <span dangerouslySetInnerHTML={{ __html: displayText || '' }} />
                {noteSuperscript}
            </div>
            {type === 'Tabela' && tableData && <SmartTableRenderer data={tableData} onSelect={onSelect} />}
            {type === 'Figura' && figureData && <div className="flex justify-center"><img src={figureData.url} alt={text} style={{ width: figureData.resolution?.width, height: figureData.resolution?.height, maxWidth: '100%' }} /></div>}
            {type === 'Mapa' && mapData && (
                <div className="space-y-4">
                    {mapData.files?.map((f, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{i + 1}</span>
                            <a href={f.url} target="_blank" className="block text-sm text-primary hover:underline">
                                {f.name || `Camada ${i + 1}`}
                            </a>
                        </div>
                    ))}
                    {mapData.screen && <div className="flex justify-center"><img src={mapData.screen.url} alt={text} style={{ width: mapData.screen.resolution?.width, height: mapData.screen.resolution?.height, maxWidth: '100%' }} /></div>}
                </div>
            )}
        </div>
    );

    return (
        <div className={cn("mb-2 text-justify relative", indentClass)} style={getElementStyle(element, originalEndValidity)}>
            {keyDisplay && <span className="mr-1">{keyDisplay}</span>}
            <span dangerouslySetInnerHTML={{ __html: finalDisplayText }} />
            {noteSuperscript}
        </div>
    );
}

function GapRow() { return <div className="text-muted-foreground my-2 font-mono text-sm tracking-widest pl-8">[...]</div>; }
