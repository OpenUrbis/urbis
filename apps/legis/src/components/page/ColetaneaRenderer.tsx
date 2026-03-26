import React, { useEffect, useState, useMemo } from 'react';
import { JSONContent } from '@tiptap/core';
import { OriginalNormativo, NormativeElementEntity } from '../../domain/entities';
import { pageService } from '../../services/page-service';
import { ElementRow } from './NormativeDocumentRenderer';
import { Loader2, ExternalLink } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ViewMode, processElementsForConsolidated, isElementInactive } from './ConsolidationLogic';
import { processGaps, processGapsUnified } from './GapLogic';
import { Link } from 'wouter';
import { getElementKey } from '../../domain/display-logic';
import { NORMATIVE_TYPES } from '../../data/normative-types';

interface ColetaneaRendererProps {
    content?: JSONContent;
    viewMode?: ViewMode;
}

export function ColetaneaRenderer({ content, viewMode = 'full' }: ColetaneaRendererProps) {
    const [docs, setDocs] = useState<Record<string, OriginalNormativo>>({});
    const [loading, setLoading] = useState(false);

    // Extract refs and fetch docs
    useEffect(() => {
        if (!content) return;
        
        const refs = new Set<string>();
        const traverse = (node: JSONContent) => {
            if (node.type === 'reference' && node.attrs?.pageId) {
                refs.add(node.attrs.pageId);
            }
            if (node.content) node.content.forEach(traverse);
        };
        traverse(content);

        if (refs.size > 0) {
            setLoading(true);
            Promise.all(Array.from(refs).map(id => pageService.getById(id)))
                .then(pages => {
                    const docMap: Record<string, OriginalNormativo> = {};
                    pages.forEach(p => {
                        if (p && p.type === 'original_normativo' && p.entity) {
                            docMap[p.id] = p.entity as OriginalNormativo;
                        }
                    });
                    setDocs(docMap);
                })
                .finally(() => setLoading(false));
        }
    }, [content]);

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-6 w-6" /></div>;
    if (!content || !content.content) return null;

    return (
        <div className="space-y-6">
            {content.content.map((block, idx) => {
                let referenceNode: JSONContent | null = null;
                
                if (block.type === 'reference') {
                    referenceNode = block;
                } else if (block.type === 'paragraph' && block.content?.length === 1 && block.content[0].type === 'reference') {
                    referenceNode = block.content[0];
                }

                if (referenceNode) {
                    const { pageId, elementId, elementIds, segmentsMap } = referenceNode.attrs || {};
                    const doc = docs[pageId];
                    if (doc) {
                        const normativeTypeLabel =
                            NORMATIVE_TYPES[doc.normativeType as keyof typeof NORMATIVE_TYPES] ?? doc.normativeType;

                        // Handle Grouped Elements
                        if (elementIds && elementIds.length > 0) {
                            const selectedSet = new Set(elementIds);
                            const selectedElements = doc.elements.filter(el => selectedSet.has(el.id));
                            
                            // Use Unified Gap Logic comparing against full original document
                            let elements = processGapsUnified(selectedElements, doc.elements) as any[];
                            
                            // Apply Consolidation Logic
                            if (viewMode === 'consolidated') {
                                const entitiesOnly = elements.filter(e => e.type !== 'Gap') as NormativeElementEntity[];
                                const consolidated = processElementsForConsolidated(entitiesOnly);
                                elements = processGapsUnified(consolidated, doc.elements);
                            }

                            if (elements && elements.length > 0) {
                                // Construct note map for these elements
                                const noteMap = new Map<string, string[]>();
                                doc.elements.forEach(n => {
                                    if (n.type === 'Nota' && n.noteData) {
                                        n.noteData.forEach(nd => {
                                            noteMap.set(nd.targetElementId, [...(noteMap.get(nd.targetElementId)||[]), n.index || '']);
                                        });
                                    }
                                });

                                return (
                                    <div key={idx} className="relative group my-6">
                                        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-muted group-hover:bg-primary/50 transition-colors rounded-full" />
                                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4 pl-2 font-bold border-b pb-2 flex justify-between items-center">
                                            <span>
                                                {normativeTypeLabel}
                                                {doc.number && <span> Nº {doc.number}</span>}
                                                <span className="lowercase font-normal"> de </span>
                                                {formatDate(doc.actDate || doc.publicationDate, true)}
                                            </span>
                                            <Link href={`/pages/${doc.id}#el-${elements.find(e => e.type !== 'Gap')?.id || elementIds[0]}`} className="text-muted-foreground hover:text-primary transition-colors p-1" title="Abrir Original Normativo">
                                                <ExternalLink className="h-3 w-3" />
                                            </Link>
                                        </div>
                                        <div className="pl-2 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-x-12 relative items-start">
                                            {elements.map((el, elIdx) => {
                                                if (el.type === 'Gap') {
                                                    return <div key={el.id || elIdx} className="col-start-1 text-muted-foreground my-2 font-mono text-sm tracking-widest pl-8">[...]</div>;
                                                }

                                                // Handle Text Segmentation/Omission if segments are present in attributes
                                                // We check segmentsMap first (multi-element), then legacy single-element segments
                                                const segments = segmentsMap?.[el.id] || ((elementId === el.id) ? referenceNode?.attrs?.segments : undefined);
                                                
                                                let displayElement = el;
                                                
                                                if (segments && Array.isArray(segments) && segments.length > 0) {
                                                    // Treat segments as OMISSIONS
                                                    let newText = "";
                                                    let currentIndex = 0;
                                                    const sortedSegments = [...segments].sort((a: any, b: any) => a.start - b.start);
                                                    
                                                    sortedSegments.forEach((seg: any) => {
                                                        // Text before the omission (Keep)
                                                        if (seg.start > currentIndex) {
                                                            newText += el.text.substring(currentIndex, seg.start);
                                                        }
                                                        
                                                        // Analyze the Omitted Part (from seg.start to seg.end)
                                                        const omittedText = el.text.substring(seg.start, seg.end);
                                                        const key = getElementKey(el);
                                                        const normOmitted = omittedText.replace(/[^\w\d]/g, '').toLowerCase();
                                                        const normKey = key.replace(/[^\w\d]/g, '').toLowerCase();
                                                        
                                                        // If the omitted text is NOT just the Key/Prefix, check type
                                                        if (normOmitted !== normKey && !normKey.startsWith(normOmitted)) {
                                                            if (seg.text) {
                                                                // Supplement: Keep original text + add supplement
                                                                // Requirement: "trechos, em itálico, entre colchetes"
                                                                const separator = omittedText.endsWith(' ') ? '' : ' ';
                                                                newText += omittedText + `${separator}<span class="italic"> [${seg.text}]</span>`;
                                                            } else {
                                                                // Omission: Replace with [...]
                                                                newText += " [...] ";
                                                            }
                                                        } else if (seg.text) {
                                                            // If it was key (hidden), but we have supplement, we might want to show it?
                                                            // E.g. Art. 1 [nota].
                                                            // If key is hidden by omittedText logic, we usually don't show it here.
                                                            // But ElementRow handles key display.
                                                            // If I select "Art. 1", it matches key.
                                                            // Logic below `if (normOmitted !== normKey ...)` implies we SKIP adding `omittedText` to `newText` if it matches key?
                                                            // Wait, my logic above:
                                                            // If `normOmitted !== normKey`: I add `[...]` (omission) OR `omittedText + supplement`.
                                                            // If `normOmitted === normKey`: I do NOTHING. `omittedText` is NOT added.
                                                            // This effectively HIDES the key text from `displayText`.
                                                            // Because `ElementRow` will prepend the Key if it's detected.
                                                            // But if I want to supplement the key?
                                                            // "Art. 1 [revogado]".
                                                            // If I select "Art. 1" and supplement "[revogado]".
                                                            // Key match -> Skip adding "Art. 1".
                                                            // But I should add the supplement!
                                                            newText += ` <span class="italic text-muted-foreground">[${seg.text}]</span>`;
                                                        }
                                                        
                                                        currentIndex = seg.end;
                                                    });

                                                    // Remaining text (Keep)
                                                    if (currentIndex < el.text.length) {
                                                        newText += el.text.substring(currentIndex);
                                                    }
                                                    
                                                    displayElement = { ...el, text: newText };
                                                }

                                                return <ElementRow key={el.id} element={displayElement} noteMap={noteMap} viewMode={viewMode} />;
                                            })}
                                        </div>
                                    </div>
                                );
                            }
                        } 
                        // Handle Single Element (Legacy)
                        else if (elementId && elementId !== 'root') {
                            const el = doc.elements?.find(e => e.id === elementId);
                            
                            // Check visibility for Consolidated Mode
                            const isVisible = viewMode === 'full' || !isElementInactive(el!);

                            if (el && isVisible) {
                                const noteMap = new Map<string, string[]>();
                                doc.elements.forEach(n => {
                                    if (n.type === 'Nota' && n.noteData) {
                                        n.noteData.forEach(nd => {
                                            if (nd.targetElementId === el.id) {
                                                noteMap.set(el.id, [...(noteMap.get(el.id)||[]), n.index || '']);
                                            }
                                        });
                                    }
                                });

                                return (
                                    <div key={idx} className="relative group">
                                        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-muted group-hover:bg-primary/50 transition-colors rounded-full" />
                                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 pl-2 flex justify-between items-center">
                                            <span>
                                                {normativeTypeLabel}
                                                {doc.number && <span> Nº {doc.number}</span>}
                                                <span className="lowercase font-normal"> de </span>
                                                {formatDate(doc.actDate || doc.publicationDate, true)}
                                            </span>
                                            <Link href={`/pages/${doc.id}#el-${elementId}`} className="text-muted-foreground hover:text-primary transition-colors p-1" title="Abrir Original Normativo">
                                                <ExternalLink className="h-3 w-3" />
                                            </Link>
                                        </div>
                                        <div className="pl-2 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-x-12 relative items-start">
                                            <ElementRow element={el} noteMap={noteMap} viewMode={viewMode} />
                                        </div>
                                    </div>
                                );
                            } else if (el && viewMode === 'consolidated') {
                                // If inactive and consolidated, maybe show separator or nothing?
                                // Requirement: "No caso de apenas partes inativas, devem ser inseridas em seu lugar separações '[...]' em linha."
                                // If the WHOLE element is referenced but inactive, we probably show [...]
                                return (
                                    <div key={idx} className="text-center text-muted-foreground my-4 font-mono text-sm tracking-widest">
                                        [...]
                                    </div>
                                );
                            }
                        } else {
                            // Root link
                            return (
                                <div key={idx} className="border p-4 rounded my-4 bg-muted/10">
                                    <div className="font-bold">{normativeTypeLabel} {doc.number}</div>
                                    <div className="text-sm italic">{doc.ementa}</div>
                                </div>
                            );
                        }
                    }
                }

                // Simple Text Renderer Fallback
                if (block.type === 'paragraph' || block.type === 'heading') {
                     const text = block.content?.map(c => c.text).join('') || '';
                     if (!text.trim()) return <br key={idx} />; // spacer
                     
                     const Content = () => {
                        if (block.type === 'heading') {
                            const Tag = `h${block.attrs?.level || 2}` as keyof JSX.IntrinsicElements;
                            return <Tag className="font-bold mt-4 mb-2">{text}</Tag>;
                        }
                        return <p className="mb-2 text-justify">{text}</p>;
                     };

                     return (
                        <div key={idx} className="pl-2 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-x-12 relative items-start">
                            <div className="col-start-1 pr-4 xl:pr-8">
                                <Content />
                            </div>
                        </div>
                     );
                }
                
                return null;
            })}
        </div>
    );
}

const formatDate = (dateStr?: string, full: boolean = false) => {
    if (!dateStr) return '';
    try {
        const parsed = parse(dateStr, 'dd.MM.yyyy', new Date());
        if (!isValid(parsed)) return dateStr;
        if (full) return format(parsed, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
        return format(parsed, 'dd.MM.yyyy');
    } catch { return dateStr; }
};
