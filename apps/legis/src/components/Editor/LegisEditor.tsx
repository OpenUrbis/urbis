import React, { useState, useCallback, useMemo } from 'react';
import NovelEditorWrapper from './index';
import { Dialog, DialogContent, DialogHeader, DialogTitle, Textarea, DialogFooter, Button } from '@open-urbis/map-ui';
import { CollectionLinkManager } from '../collection/CollectionLinkManager';
import { Editor as TiptapEditor, JSONContent } from '@tiptap/core';
import { Link as LinkIcon, BookOpen, Code } from 'lucide-react';
import { suggestionItems as defaultSuggestionItems } from './slash-command';
import { CollectionLink, OriginalNormativo } from '../../domain/entities';
import { pageService } from '../../services/page-service';
import { parse, isValid, compareAsc } from 'date-fns';

interface LegisEditorProps {
    initialContent?: JSONContent;
    onChange?: (content: JSONContent) => void;
    onEditorReady?: (editor: TiptapEditor) => void;
    readOnly?: boolean;
    isNormative?: boolean;
    className?: string;
}

export function LegisEditor({ 
    initialContent, 
    onChange, 
    onEditorReady,
    readOnly = false, 
    isNormative = false,
    className 
}: LegisEditorProps) {
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [htmlDialogOpen, setHtmlDialogOpen] = useState(false);
    const [htmlContent, setHtmlContent] = useState('');
    const [editor, setEditor] = useState<TiptapEditor | null>(null);
    const [selectionRange, setSelectionRange] = useState<{ from: number; to: number } | null>(null);
    const [linkManagerInitialLinks, setLinkManagerInitialLinks] = useState<CollectionLink[]>([]);
    const [editingNodePos, setEditingNodePos] = useState<number | null>(null);

    const handleEditLink = useCallback((node: any, getPos: () => number) => {
        const { pageId, elementIds, segmentsMap } = node.attrs;
        
        const link: CollectionLink = {
            resourceId: pageId,
            resourceType: 'original_normativo',
            linkedElements: elementIds?.map((id: string) => ({
                elementId: id,
                segments: segmentsMap?.[id]
            })) || []
        };
        
        setLinkManagerInitialLinks([link]);
        setEditingNodePos(getPos());
        setLinkDialogOpen(true);
    }, []);

    const handleEditorReady = (e: TiptapEditor) => {
        setEditor(e);
        // Register Edit Handler
        if ((e.storage as any).reference) {
            (e.storage as any).reference.onEdit = handleEditLink;
        }
        if (onEditorReady) onEditorReady(e);
    };

    // Update handler when editor changes (re-bind if needed, but storage is persistent per editor instance)
    // Actually, handleEditLink depends on state setters, so it's stable.
    // If editor instance changes, we re-bind in handleEditorReady.

    const handleHtmlInsert = () => {
        if (!editor || !htmlContent.trim()) return;
        editor.chain().focus().insertContent(htmlContent).run();
        setHtmlDialogOpen(false);
        setHtmlContent('');
    };

    // Auto-normalize ordinals on change (if normative)
    const handleContentChange = useCallback((newContent: JSONContent) => {
        if (isNormative && editor) {
            // Logic to normalize text nodes? 
            // Better to normalize during parsing/saving, but requirement says "generating automatically"
            // We'll normalize in the onChange provided by Novel.
        }
        if (onChange) onChange(newContent);
    }, [isNormative, onChange, editor]);

    const handleCollectionLinkSave = useCallback((links: CollectionLink[], cache: Record<string, OriginalNormativo>) => {
        if (!editor) return;
        
        // Sort Documents by Date (Publication or Act)
        const getDate = (doc?: OriginalNormativo) => {
             if (!doc) return new Date(0);
             const dateStr = doc.publicationDate || doc.actDate;
             if (!dateStr) return new Date(0);
             try {
                 const d = parse(dateStr, 'dd.MM.yyyy', new Date());
                 return isValid(d) ? d : new Date(0);
             } catch { return new Date(0); }
        };

        const sortedLinks = [...links].sort((a, b) => {
             const dateA = getDate(cache[a.resourceId]);
             const dateB = getDate(cache[b.resourceId]);
             return compareAsc(dateA, dateB);
        });

        const contentToInsert: JSONContent[] = [];

        sortedLinks.forEach((link, lIndex) => {
            const doc = cache[link.resourceId];
            const docLabel = doc ? (doc.number ? `${doc.normativeType} ${doc.number} ${doc.actDate ? `- ${doc.actDate}` : ''}` : (doc.ementa ? doc.ementa.substring(0, 20) + '...' : 'Documento')) : `Doc ${link.resourceId}`;

            if (link.linkedElements && link.linkedElements.length > 0) {
                // Sort Linked Elements by order in Original
                const docElements = doc?.elements || [];
                const sortedLinkedElements = [...link.linkedElements].sort((a, b) => {
                     const idxA = docElements.findIndex(e => e.id === a.elementId);
                     const idxB = docElements.findIndex(e => e.id === b.elementId);
                     if (idxA === -1) return 1;
                     if (idxB === -1) return -1;
                     return idxA - idxB;
                });

                // Collect element IDs
                const elementIds = sortedLinkedElements.map(le => le.elementId);
                
                // Collect segments
                const segmentsMap: Record<string, any> = {};
                sortedLinkedElements.forEach(le => {
                    if (le.segments && le.segments.length > 0) {
                        segmentsMap[le.elementId] = le.segments;
                    }
                });

                // Collect preloaded data
                const groupedElements: any[] = [];
                const selectedSet = new Set(elementIds);
                
                if (doc?.elements) {
                    doc.elements.forEach(el => {
                        if (selectedSet.has(el.id)) {
                            // Push Element (with segments)
                            const segments = segmentsMap[el.id];
                            groupedElements.push({
                                ...el,
                                segments: segments
                            });
                        }
                    });
                }

                contentToInsert.push({
                    type: 'reference',
                    attrs: {
                        pageId: link.resourceId,
                        elementIds: elementIds,
                        label: docLabel,
                        groupedElements: groupedElements,
                        segmentsMap: segmentsMap
                    }
                });
            } else {
                // Whole doc linked
                contentToInsert.push({
                    type: 'reference',
                    attrs: {
                        pageId: link.resourceId,
                        elementId: 'root',
                        label: docLabel,
                        text: doc?.ementa || docLabel
                    }
                });
            }
            
            // Add separator between documents if needed (e.g. newline)
            if (lIndex < sortedLinks.length - 1) {
                contentToInsert.push({
                    type: 'paragraph',
                    content: [] // Empty paragraph as spacer
                });
            }
        });

        if (contentToInsert.length > 0) {
            if (editingNodePos !== null) {
                // Replace existing node(s)
                // Note: If multiple docs returned (splitting one link into multiple), we replace the single node with multiple nodes.
                // We assume editingNodePos points to the start of the reference node.
                // We need to delete it first.
                // Since we don't have the node size here easily without finding it again:
                const node = editor.state.doc.nodeAt(editingNodePos);
                if (node) {
                    editor.chain().deleteRange({ from: editingNodePos, to: editingNodePos + node.nodeSize }).insertContentAt(editingNodePos, contentToInsert).run();
                } else {
                    // Fallback insert if node not found
                    editor.chain().focus().insertContent(contentToInsert).run();
                }
                setEditingNodePos(null);
            } else {
                // Insert new
                editor.chain().focus().insertContent(contentToInsert).run();
            }
        }
        
        setLinkDialogOpen(false);
        setLinkManagerInitialLinks([]); // Reset for next time
    }, [editor, editingNodePos]);

    const customSuggestionItems = useMemo(() => [
        ...defaultSuggestionItems,
        {
            title: "Vínculo Normativo",
            description: "Buscar e inserir referência a outra norma",
            searchTerms: ["link", "vinculo", "norma", "referencia"],
            icon: <LinkIcon size={18} />,
            command: ({ editor, range }: any) => {
                setSelectionRange(range);
                setLinkManagerInitialLinks([]); // Clear for new
                setEditingNodePos(null);
                // Delete the slash command text
                editor.chain().focus().deleteRange(range).run();
                setLinkDialogOpen(true);
            },
        },
        {
            title: "Inserir HTML",
            description: "Inserir código HTML cru",
            searchTerms: ["html", "codigo", "embed"],
            icon: <Code size={18} />,
            command: ({ editor, range }: any) => {
                // Delete the slash command text
                editor.chain().focus().deleteRange(range).run();
                setHtmlDialogOpen(true);
            },
        }
    ], []);

    return (
        <div className={className}>
            <NovelEditorWrapper 
                initialValue={initialContent}
                onChange={handleContentChange}
                editable={!readOnly}
                onEditorReady={handleEditorReady}
                isNormative={isNormative}
                suggestionItems={customSuggestionItems}
            />

            <CollectionLinkManager
                open={linkDialogOpen}
                onOpenChange={setLinkDialogOpen}
                initialLinks={linkManagerInitialLinks}
                onSave={handleCollectionLinkSave}
            />

            <Dialog open={htmlDialogOpen} onOpenChange={setHtmlDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Code className="h-5 w-5 text-primary" />
                            Inserir HTML
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea 
                            value={htmlContent} 
                            onChange={(e) => setHtmlContent(e.target.value)} 
                            placeholder="<div>Conteúdo HTML...</div>"
                            className="min-h-[200px] font-mono text-xs"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setHtmlDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleHtmlInsert}>Inserir</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
