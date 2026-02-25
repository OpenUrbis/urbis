import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Input, ScrollArea, Checkbox, Badge, Separator, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Label, Textarea } from '@open-urbis/map-ui';
import { ChevronRight, ChevronDown, FileText, Link as LinkIcon, Layers, X, Loader2, Plus, Trash2, Search, Circle, CheckCircle2, MousePointerClick } from 'lucide-react';
import { CollectionLink, LinkedElement, OriginalNormativo, NormativeElementEntity } from '../../domain/entities';
import { pageService, NormativeSearchResult, AdvancedSearchQuery, SearchCondition } from '../../services/page-service';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@open-urbis/map-ui';
import { getWordIndicesFromSelection, extractTextFromWordIndices } from '../../domain/text-utils';
import { SegmentSelector, Segment } from '../common/SegmentSelector';
import { ElementContent } from '../page/NormativeDocumentRenderer';

interface CollectionLinkManagerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialLinks: CollectionLink[];
    onSave: (links: CollectionLink[], cache: Record<string, OriginalNormativo>) => void;
    selectionMode?: 'multiple' | 'single';
    localElements?: NormativeElementEntity[]; // Elements from the current document for local search
}

export function CollectionLinkManager({ open, onOpenChange, initialLinks, onSave, selectionMode = 'multiple', localElements }: CollectionLinkManagerProps) {
    const [conditions, setConditions] = useState<SearchCondition[]>([
        { id: '1', field: 'term', operator: 'contains', value: '', connector: 'AND' }
    ]);
    
    // Debounce the whole conditions array? Or just trigger on button? 
    // "concatenação de condições" suggests complex query. Let's add a "Buscar" button instead of auto-search for complex queries to avoid lag/flicker.
    // Or debounce.
    const debouncedConditions = useDebounce(conditions, 500);

    const [searchResults, setSearchResults] = useState<NormativeSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    
    const [draftLinks, setDraftLinks] = useState<CollectionLink[]>(initialLinks);
    const [expandedDocs, setExpandedDocs] = useState<string[]>([]);
    
    const [docCache, setDocCache] = useState<Record<string, OriginalNormativo>>({});
    const [loadingDocs, setLoadingDocs] = useState<string[]>([]);

    // Reset state when dialog opens
    useEffect(() => {
        if (open) {
            setDraftLinks(initialLinks);
            setSearchResults([]);
            setConditions([{ id: '1', field: 'term', operator: 'contains', value: '', connector: 'AND' }]);
            setExpandedDocs([]);
        }
    }, [open, initialLinks]);

    // Search Effect
    useEffect(() => {
        // Only search if at least one condition has a value
        const hasValue = debouncedConditions.some(c => c.value.trim() !== '');
        if (!hasValue && !localElements) {
            setSearchResults([]);
            return;
        }

        const doSearch = async () => {
            setIsSearching(true);
            try {
                if (localElements) {
                    // Local Search
                    const term = debouncedConditions.find(c => c.field === 'term')?.value.toLowerCase() || '';
                    
                    const filtered = localElements.filter(el => {
                        if (!term) return true;
                        return el.text.toLowerCase().includes(term) || 
                               el.type.toLowerCase().includes(term) || 
                               (el.index && el.index.toLowerCase().includes(term));
                    });

                    const results: NormativeSearchResult[] = filtered.map(el => ({
                        pageId: 'current',
                        pageTitle: 'Documento Atual',
                        elementId: el.id,
                        type: el.type,
                        index: el.index,
                        text: el.text
                    }));
                    
                    setSearchResults(results);
                    setExpandedDocs(['current']);
                    
                    // Mock cache for current doc
                    const currentDoc: OriginalNormativo = {
                        id: 'current',
                        type: 'original_normativo',
                        normativeType: 'L' as any,
                        authorityId: 'current',
                        ementa: 'Documento Atual',
                        elements: localElements,
                        sources: [],
                        createdAt: '',
                        updatedAt: ''
                    };
                    setDocCache(prev => ({ ...prev, current: currentDoc }));

                } else {
                    // Global Search
                    const query: AdvancedSearchQuery = {
                        conditions: debouncedConditions
                    };
                    const results = await pageService.searchNormativeElements(query);
                    setSearchResults(results);
                    
                    // Auto-expand all result documents
                    const pageIds = Array.from(new Set(results.map(r => r.pageId)));
                    setExpandedDocs(pageIds);
                    
                    // Pre-fetch all docs
                    pageIds.forEach(id => {
                        if (!docCache[id]) {
                           if (!loadingDocs.includes(id)) {
                               setLoadingDocs(prev => [...prev, id]);
                               pageService.getById(id).then(page => {
                                    if (page && page.type === 'original_normativo' && page.entity) {
                                        setDocCache(prev => ({ ...prev, [id]: page.entity as OriginalNormativo }));
                                    }
                               }).finally(() => setLoadingDocs(prev => prev.filter(pid => pid !== id)));
                           }
                        }
                    });
                }
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setIsSearching(false);
            }
        };

        doSearch();
    }, [debouncedConditions, localElements]);

    const addCondition = () => {
        setConditions(prev => [
            ...prev,
            { id: Math.random().toString(), field: 'term', operator: 'contains', value: '', connector: 'AND' }
        ]);
    };

    const removeCondition = (id: string) => {
        setConditions(prev => {
            if (prev.length === 1) return prev; // Keep at least one
            return prev.filter(c => c.id !== id);
        });
    };

    const updateCondition = (id: string, updates: Partial<SearchCondition>) => {
        setConditions(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    // Group Results by Page
    const groupedResults = useMemo(() => {
        const groups: Record<string, NormativeSearchResult[]> = {};
        searchResults.forEach(r => {
            if (!groups[r.pageId]) groups[r.pageId] = [];
            groups[r.pageId].push(r);
        });
        return groups;
    }, [searchResults]);

    // Fetch Doc Structure on Expand
    const handleExpand = async (pageId: string) => {
        if (expandedDocs.includes(pageId)) {
            setExpandedDocs(prev => prev.filter(id => id !== pageId));
            return;
        }

        setExpandedDocs(prev => [...prev, pageId]);

        if (!docCache[pageId] && !loadingDocs.includes(pageId)) {
            setLoadingDocs(prev => [...prev, pageId]);
            try {
                const page = await pageService.getById(pageId);
                if (page && page.type === 'original_normativo' && page.entity) {
                    setDocCache(prev => ({ ...prev, [pageId]: page.entity as OriginalNormativo }));
                } else {
                    // Handle non-normative or legacy pages? 
                    // For now only structured Normative docs support tree linking
                }
            } catch (e) {
                console.error("Failed to load doc structure", e);
            } finally {
                setLoadingDocs(prev => prev.filter(id => id !== pageId));
            }
        }
    };

    // Helper to check if an element is linked
    const isElementLinked = (docId: string, elementId: string) => {
        const link = draftLinks.find(l => l.resourceId === docId);
        if (!link) return false;
        if (!link.linkedElements || link.linkedElements.length === 0) return true; 
        return link.linkedElements.some(le => le.elementId === elementId);
    };

    // Helper to get descendants
    const getDescendants = (doc: OriginalNormativo, elementId: string): string[] => {
        const children = doc.elements.filter(e => e.parentId === elementId);
        let descendants = children.map(c => c.id);
        children.forEach(c => {
            descendants = [...descendants, ...getDescendants(doc, c.id)];
        });
        return descendants;
    };

    // Segment Selection State
    const [segmentSelectionOpen, setSegmentSelectionOpen] = useState(false);
    const [currentSegmentTarget, setCurrentSegmentTarget] = useState<{ docId: string, elementId: string, text: string } | null>(null);

    // Toggle Element Link
    const toggleElementLink = (docId: string, elementId: string) => {
        setDraftLinks(prev => {
            if (selectionMode === 'single') {
                 const isSelected = prev.some(l => l.resourceId === docId && l.linkedElements?.some(le => le.elementId === elementId));
                 if (isSelected) return [];
                 
                 return [{
                     resourceId: docId,
                     resourceType: 'original_normativo',
                     linkedElements: [{ elementId }]
                 }];
            }

            const existingLinkIndex = prev.findIndex(l => l.resourceId === docId);
            let newLinks = [...prev];
            const doc = docCache[docId];
            
            // Logic for recursive selection
            let descendants: string[] = [];
            let isContainer = false;
            
            if (doc) {
                descendants = getDescendants(doc, elementId);
                const element = doc.elements.find(e => e.id === elementId);
                isContainer = !!element && ['Artigo', 'Parágrafo', 'Inciso'].includes(element.type);
            }

            if (existingLinkIndex >= 0) {
                const link = { ...newLinks[existingLinkIndex] };
                const linkedElements = link.linkedElements ? [...link.linkedElements] : [];
                
                const isSelected = linkedElements.some(le => le.elementId === elementId);
                // Check if ALL descendants are selected (if there are descendants)
                const areChildrenSelected = descendants.length > 0 && descendants.every(dId => linkedElements.some(le => le.elementId === dId));
                
                if (isContainer && descendants.length > 0) {
                    if (!isSelected) {
                        // State 1: Unselected -> Select All (Parent + Children)
                        linkedElements.push({ elementId });
                        descendants.forEach(dId => {
                            if (!linkedElements.some(le => le.elementId === dId)) {
                                linkedElements.push({ elementId: dId });
                            }
                        });
                    } else if (areChildrenSelected) {
                         // State 2: Selected All -> Select Parent Only (Deselect children)
                         descendants.forEach(dId => {
                             const idx = linkedElements.findIndex(le => le.elementId === dId);
                             if (idx >= 0) linkedElements.splice(idx, 1);
                         });
                    } else {
                        // State 3: Selected Parent Only (or partial) -> Deselect Parent
                        // (If partial children selected, should we select all or deselect parent? 
                        // Requirement: "mais um clique deve alterar para a seleção somente do caput".
                        // Assuming flow: [Empty] -> [All] -> [Caput] -> [Empty])
                        // But if we are in [Caput] state (children not selected), "mais um clique" means deselect.
                        const idx = linkedElements.findIndex(le => le.elementId === elementId);
                        if (idx >= 0) linkedElements.splice(idx, 1);
                        // Also ensure descendants are cleared if any remain (from partial state)
                        descendants.forEach(dId => {
                             const idx = linkedElements.findIndex(le => le.elementId === dId);
                             if (idx >= 0) linkedElements.splice(idx, 1);
                        });
                    }
                } else {
                    // Simple toggle for non-containers or containers without children loaded/existing
                    if (isSelected) {
                         const idx = linkedElements.findIndex(le => le.elementId === elementId);
                         if (idx >= 0) linkedElements.splice(idx, 1);
                    } else {
                        linkedElements.push({ elementId });
                    }
                }

                link.linkedElements = linkedElements;
                
                if (linkedElements.length === 0) {
                    newLinks.splice(existingLinkIndex, 1);
                } else {
                    newLinks[existingLinkIndex] = link;
                }
            } else {
                // Create new resource link
                const newLinkedElements = [{ elementId }];
                if (isContainer && descendants.length > 0) {
                    descendants.forEach(dId => newLinkedElements.push({ elementId: dId }));
                }
                
                newLinks.push({
                    resourceId: docId,
                    resourceType: 'original_normativo',
                    linkedElements: newLinkedElements
                });
            }
            return newLinks;
        });
    };

    const openSegmentSelector = (docId: string, elementId: string, text: string) => {
        setCurrentSegmentTarget({ docId, elementId, text });
        setSegmentSelectionOpen(true);
    };

    const handleSegmentsConfirm = (segments: Segment[]) => {
        if (!currentSegmentTarget) return;
        
        setDraftLinks(prev => {
            const newLinks = [...prev];
            const linkIdx = newLinks.findIndex(l => l.resourceId === currentSegmentTarget.docId);
            if (linkIdx >= 0) {
                const link = { ...newLinks[linkIdx] };
                const linkedElements = link.linkedElements ? [...link.linkedElements] : [];
                const leIdx = linkedElements.findIndex(le => le.elementId === currentSegmentTarget.elementId);
                
                if (leIdx >= 0) {
                    const le = { ...linkedElements[leIdx] };
                    // We append segments instead of replacing
                    const newSegments = segments.map(s => ({
                        start: s.start, 
                        end: s.end, 
                        text: s.text,
                        type: s.type,
                        supplementText: s.supplementText
                    }));
                    le.segments = [...(le.segments || []), ...newSegments];
                    linkedElements[leIdx] = le;
                    link.linkedElements = linkedElements;
                    newLinks[linkIdx] = link;
                }
            }
            return newLinks;
        });
    };

    // Tree Node Component
    const TreeNode = ({ element, doc, level = 0, visibleIds }: { element: NormativeElementEntity, doc: OriginalNormativo, level?: number, visibleIds?: Set<string> }) => {
        const isLinked = isElementLinked(doc.id, element.id);
        const children = doc.elements.filter(e => e.parentId === element.id && (!visibleIds || visibleIds.has(e.id)));
        const hasChildren = children.length > 0;
        const [isExpanded, setIsExpanded] = useState(true);

        return (
            <div className="ml-4 border-l border-border/50 pl-2 my-1">
                <div className="flex items-start gap-2 hover:bg-muted/30 p-1 rounded">
                    {hasChildren && (
                        <button onClick={() => setIsExpanded(!isExpanded)} className="mt-0.5 text-muted-foreground hover:text-foreground">
                            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        </button>
                    )}
                    {!hasChildren && <div className="w-3" />}
                    
                    <div 
                        onClick={(e) => { e.stopPropagation(); toggleElementLink(doc.id, element.id); }}
                        className="cursor-pointer mt-0.5"
                    >
                        {selectionMode === 'single' ? (
                            isLinked ? 
                                <CheckCircle2 className="h-4 w-4 text-primary fill-primary/10" /> : 
                                <Circle className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        ) : (
                            <Checkbox 
                                checked={isLinked} 
                                className="pointer-events-none" 
                            />
                        )}
                    </div>
                    
                    <div className="text-sm flex-1">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-[10px] h-4 px-1">{element.type} {element.index}</Badge>
                            {isLinked && <Badge className="text-[10px] h-4 px-1 bg-green-100 text-green-700 hover:bg-green-100">Vinculado</Badge>}
                            {isLinked && (
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-4 px-1 text-[10px] gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    onClick={(e) => { e.stopPropagation(); openSegmentSelector(doc.id, element.id, element.text); }}
                                    title="Marcar trecho específico"
                                >
                                    <MousePointerClick className="h-3 w-3" />
                                    {draftLinks.find(l => l.resourceId === doc.id)?.linkedElements?.find(le => le.elementId === element.id)?.segments?.length ? 'Trecho Marcado' : 'Marcar Trecho'}
                                </Button>
                            )}
                        </div>
                        <div className="text-muted-foreground text-xs mt-0.5 whitespace-pre-wrap">
                            <div dangerouslySetInnerHTML={{ 
                                __html: highlightHtml(element.text, conditions.find(c => c.field === 'term')?.value || '') 
                            }} />
                        </div>
                        {element.type === 'Tabela' && element.tableData && (
                            <div className="mt-2 pointer-events-none scale-75 origin-top-left -mb-12">
                                <ElementContent element={element} noteMap={new Map()} viewMode="full" />
                            </div>
                        )}
                    </div>
                </div>
                
                {isExpanded && children.map(child => (
                    <TreeNode key={child.id} element={child} doc={doc} level={level + 1} visibleIds={visibleIds} />
                ))}
            </div>
        );
    };

    // Highlighter Utility
    const highlightHtml = (html: string, term: string) => {
        if (!term || !html) return html;
        
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const walk = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);
            let node;
            const nodesToReplace: { node: Node, content: string }[] = [];

            while (node = walk.nextNode()) {
                const text = node.textContent;
                if (text && text.toLowerCase().includes(term.toLowerCase())) {
                    // Simple replacement for now - this handles multiple matches in one node
                    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                    const newHtml = text.replace(regex, '<strong class="bg-yellow-200 dark:bg-yellow-900/50 rounded-sm px-0.5">$1</strong>');
                    nodesToReplace.push({ node, content: newHtml });
                }
            }

            nodesToReplace.forEach(({ node, content }) => {
                const span = document.createElement('span');
                span.innerHTML = content;
                node.parentNode?.replaceChild(span, node);
            });

            return doc.body.innerHTML;
        } catch (e) {
            console.error("Highlight error", e);
            return html;
        }
    };

    // Highlighter Component (for plain text context snippet)
    const HighlightText = ({ text, highlight }: { text: string, highlight: string }) => {
        if (!highlight) return <>{text}</>;
        const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) => 
                    part.toLowerCase() === highlight.toLowerCase() ? <strong key={i} className="bg-yellow-200 dark:bg-yellow-900/50 rounded-sm px-0.5">{part}</strong> : part
                )}
            </span>
        );
    };

    // Document Result Component
    const DocumentResult = ({ pageId, results }: { pageId: string, results: NormativeSearchResult[] }) => {
        // Auto-expand if not manually toggled (assuming if it's in results, user likely wants to see it)
        // However, expandedDocs logic was: if in array, it's expanded.
        // We should add it to expandedDocs when results arrive? Or treat absence from expandedDocs as "not expanded"?
        // To auto-expand, we can initialize expandedDocs with all pageIds in useEffect.
        // But doing it here: 
        
        const isExpanded = expandedDocs.includes(pageId);
        const isLoading = loadingDocs.includes(pageId);
        const doc = docCache[pageId];
        const linkedCount = draftLinks.find(l => l.resourceId === pageId)?.linkedElements?.length || 0;
        const title = results[0]?.pageTitle || "Documento";

        const [showAll, setShowAll] = useState(false);

        // Calculate Visible Nodes (Matches + Ancestors + Siblings)
        const visibleIds = useMemo(() => {
            if (showAll) return undefined;
            if (!doc || !results) return undefined;
            const ids = new Set<string>();
            const matchedIds = new Set(results.map(r => r.elementId));

            // Identify ancestors and siblings for each match
            matchedIds.forEach(matchId => {
                let current: NormativeElementEntity | undefined = doc.elements.find(e => e.id === matchId);
                
                // Add matched element
                if (current) ids.add(current.id);

                // Traverse up (Ancestors)
                while (current && current.parentId) {
                    const parent: NormativeElementEntity | undefined = doc.elements.find(e => e.id === current?.parentId);
                    if (parent) {
                        ids.add(parent.id);
                        
                        // Add Siblings of the ancestor path? 
                        // Requirement: "elementos que estao dando match... pai, o pai do pai e o irmaos" (match, parent, parent's parent, and siblings)
                        // "os tios por exemplo nao seria pra aparecer" (uncles should not appear)
                        
                        // Interpretation: 
                        // 1. Show the matched node.
                        // 2. Show the matched node's siblings.
                        // 3. Show the matched node's parent.
                        // 4. Show the parent's parent (grandparent).
                        // 5. DO NOT show the parent's siblings (uncles).
                        
                        // So: Include match, siblings of match, and direct linear ancestors.
                        
                        // Let's adjust logic:
                        // For the matched node 'current':
                        // - Add 'current'
                        // - Add all siblings of 'current' (same parentId)
                        // - Move to parent. Add parent. 
                        // - Repeat up to root.
                        
                        current = parent;
                    } else {
                        break;
                    }
                }
                // Add Root if not added? (Parent loop handles up to root's child, parent is root)
            });

            // Second pass: Add siblings for all MATCHED nodes (and previously identified nodes? No, only siblings of matches)
            // Wait, "irmaos" usually refers to siblings of the subject.
            // If I match "Art 1", I want "Art 2" (sibling) to show? 
            // Or just siblings of the match?
            // "pai, o pai do pai e o irmaos" -> Parent, Grandparent, Siblings (of match).
            
            matchedIds.forEach(matchId => {
                const match = doc.elements.find(e => e.id === matchId);
                if (match) {
                    const siblings = doc.elements.filter(e => e.parentId === match.parentId);
                    siblings.forEach(s => ids.add(s.id));
                }
            });

            // Ensure linear ancestors are definitely in (already done in loop above essentially, but let's be strict)
            // The loop above added `parent.id`. 
            // It did NOT add `parent`'s siblings. Correct.
            
            return ids;
        }, [doc, results, showAll]);

        const rootElements = doc ? doc.elements.filter(e => !e.parentId && (!visibleIds || visibleIds.has(e.id))) : [];

        return (
            <div className="border rounded-md mb-2 bg-card">
                <div className="flex items-center p-3 gap-3 cursor-pointer hover:bg-muted/10 transition-colors"
                     onClick={() => handleExpand(pageId)}
                >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> :
                     isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    
                    <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{title}</span>
                                {linkedCount > 0 && <Badge variant="secondary" className="text-[10px] h-5">{linkedCount} selecionados</Badge>}
                            </div>
                            
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-[10px] px-2"
                                onClick={(e) => { e.stopPropagation(); setShowAll(!showAll); if (!isExpanded) handleExpand(pageId); }}
                            >
                                {showAll ? 'Filtrar resultados' : 'Ver todo documento'}
                            </Button>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            {results.length} trechos encontrados: <span className="italic">
                                <HighlightText text={results[0].text.substring(0, 50)} highlight={conditions.find(c => c.field === 'term')?.value || ''} />...
                            </span>
                        </div>
                    </div>
                </div>
                
                {isExpanded && doc && (
                    <div className="p-2 pt-0 border-t bg-muted/5">
                        {rootElements.length > 0 ? rootElements.map(el => (
                            <TreeNode key={el.id} element={el} doc={doc} visibleIds={visibleIds} />
                        )) : (
                            <div className="p-4 text-xs text-muted-foreground italic">Nenhum elemento correspondente visível nesta raiz.</div>
                        )}
                    </div>
                )}
                {isExpanded && !doc && !isLoading && (
                    <div className="p-4 text-xs text-muted-foreground italic">
                        Estrutura não disponível para este documento.
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-[95vw] h-[95vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Selecionar elementos normativos</DialogTitle>
                </DialogHeader>
                
                <div className="px-6 py-4 border-b bg-muted/10 space-y-3">
                    <div className="space-y-2">
                        {conditions.map((cond, index) => (
                            <div key={cond.id} className="flex gap-2 items-center">
                                {index > 0 && (
                                    <Select 
                                        value={cond.connector} 
                                        onValueChange={(v) => updateCondition(cond.id, { connector: v as 'AND' | 'OR' })}
                                    >
                                        <SelectTrigger className="w-[80px] h-8 text-xs bg-background">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="AND">E</SelectItem>
                                            <SelectItem value="OR">OU</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                                {index === 0 && <div className="w-[80px] text-xs font-semibold text-center text-muted-foreground">ONDE</div>}
                                
                                <Select 
                                    value={cond.field} 
                                    onValueChange={(v) => updateCondition(cond.id, { field: v as any })}
                                >
                                    <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="term">Palavra/Expressão</SelectItem>
                                        <SelectItem value="normativeType">Tipo Normativo</SelectItem>
                                        <SelectItem value="actDate">Data do Ato</SelectItem>
                                        <SelectItem value="authorityId">Autor</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select 
                                    value={cond.operator} 
                                    onValueChange={(v) => updateCondition(cond.id, { operator: v as any })}
                                >
                                    <SelectTrigger className="w-[120px] h-8 text-xs bg-background">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="contains">Contém</SelectItem>
                                        <SelectItem value="equals">Igual</SelectItem>
                                        <SelectItem value="not_contains">Não Contém</SelectItem>
                                        <SelectItem value="greater">Maior que</SelectItem>
                                        <SelectItem value="less">Menor que</SelectItem>
                                    </SelectContent>
                                </Select>

                                <div className="flex-1 relative">
                                    <Input 
                                        value={cond.value}
                                        onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                                        className="h-8 text-xs bg-background"
                                        placeholder="Valor..."
                                    />
                                    {isSearching && index === 0 && <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin text-muted-foreground" />}
                                </div>

                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => removeCondition(cond.id)}
                                    disabled={conditions.length === 1}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={addCondition} className="text-xs h-7 gap-1">
                        <Plus className="h-3 w-3" /> Adicionar Condição
                    </Button>
                </div>

                <div className="flex-1 overflow-hidden flex">
                    {/* Results / Tree Area */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {Object.keys(groupedResults).length > 0 ? (
                            <div className="space-y-4">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Resultados</h3>
                                {Object.entries(groupedResults).map(([pageId, results]) => (
                                    <DocumentResult key={pageId} pageId={pageId} results={results} />
                                ))}
                            </div>
                        ) : conditions.some(c => c.value) ? (
                            <div className="text-center py-12 text-muted-foreground text-sm">
                                {isSearching ? 'Buscando...' : 'Nenhum resultado encontrado.'}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground text-sm flex flex-col items-center gap-2">
                                <Search className="h-10 w-10 opacity-20" />
                                <span>Adicione condições para buscar normas e criar vínculos.</span>
                            </div>
                        )}
                    </div>

                    {/* Selection Summary Sidebar */}
                    <div className="w-64 border-l bg-muted/10 overflow-y-auto p-4 hidden md:block">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Vínculos Ativos</h3>
                        {draftLinks.length === 0 && <span className="text-xs text-muted-foreground italic">Nenhum vínculo.</span>}
                        <div className="space-y-4">
                            {draftLinks.map(link => {
                                const doc = docCache[link.resourceId];
                                // If doc not in cache (e.g. initial link), we might need to fetch or show partial info
                                // For now, we only show detailed info if doc is loaded or if we have title (we don't store title in link)
                                // We should probably fetch doc if missing to show title.
                                // For simplicity, we just show ID if doc missing.
                                
                                return (
                                    <div key={link.resourceId} className="space-y-2">
                                        <div className="font-medium text-xs flex items-center gap-1">
                                            <FileText className="h-3 w-3" />
                                            {doc ? (doc.number ? `${doc.normativeType} ${doc.number}` : doc.ementa.substring(0,20)) : `Doc ${link.resourceId.substring(0,8)}...`}
                                        </div>
                                        <div className="pl-4 space-y-1">
                                            {link.linkedElements?.map(le => {
                                                const el = doc?.elements.find(e => e.id === le.elementId);
                                                return (
                                                    <div key={le.elementId} className="text-xs text-muted-foreground flex justify-between items-center bg-background border p-1 rounded shadow-sm">
                                                        <span>{el ? `${el.type} ${el.index}` : `Item ${le.elementId.substring(0,8)}`}</span>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-4 w-4 hover:text-destructive"
                                                            onClick={() => toggleElementLink(link.resourceId, le.elementId)}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-4 border-t bg-background">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={() => onSave(draftLinks, docCache)}>Selecionar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Segment Selection Dialog */}
        <SegmentSelector
            open={segmentSelectionOpen}
            onOpenChange={setSegmentSelectionOpen}
            text={currentSegmentTarget?.text || ''}
            onConfirm={handleSegmentsConfirm}
        />
        </>
    );
}
