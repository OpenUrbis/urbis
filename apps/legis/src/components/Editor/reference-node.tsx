import React, { useEffect, useState } from 'react';
import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { pageService, NormativeSearchResult } from '../../services/page-service';
import { ElementContent } from '../page/NormativeDocumentRenderer';
import { getElementKey } from '../../domain/display-logic';
import { getCleanDisplayText } from '../../domain/text-utils';
import { NormativeListHeader } from '../common/NormativeListHeader';
import { processGaps, processGapsUnified } from '../page/GapLogic';
import { Button } from '@open-urbis/map-ui';
import { Edit } from 'lucide-react';
const processTextWithSegments = (text: string, segments: any[], key: string) => {
    if (!segments || segments.length === 0) return text;
    
    // Treat segments as OMISSIONS/REPLACEMENTS
    let newText = "";
    let currentIndex = 0;
    const sortedSegments = [...segments].sort((a: any, b: any) => a.start - b.start);
    
    sortedSegments.forEach((seg: any) => {
        // Text before the omission
        if (seg.start > currentIndex) {
            newText += text.substring(currentIndex, seg.start);
        }
        
        // Smart Ellipsis: Check if omitted text is just the key/prefix
        const omittedText = text.substring(seg.start, seg.end);
        const normOmitted = omittedText.replace(/[^\w\d]/g, '').toLowerCase();
        const normKey = key.replace(/[^\w\d]/g, '').toLowerCase();
        
        // If it's a supplement, we preserve the text instead of replacing with [...]
        if (seg.type === 'supplement') {
            newText += omittedText;
        } else {
            // Omission: Only add [...] if we omitted more than just the key
            if (normOmitted !== normKey && !normKey.startsWith(normOmitted)) {
                newText += " [...] ";
            }
        }

        if (seg.text) newText += ` <span class="italic text-muted-foreground">[${seg.text}]</span>`;
        
        currentIndex = seg.end;
    });

    // Remaining text
    if (currentIndex < text.length) {
        newText += text.substring(currentIndex);
    }
    
    return newText;
};

const ReferenceComponent = ({ node, editor, getPos }: any) => {
  const { pageId, elementId, elementIds, label, text, groupedElements, segmentsMap } = node.attrs;
  
  // Single element state
  const [data, setData] = useState<NormativeSearchResult | null>(text ? { 
      pageId, elementId, type: 'Ref', text, pageTitle: label 
  } : null);

  // Grouped elements state
    const [groupData, setGroupData] = useState<any[]>(
      groupedElements ? groupedElements : []
  );
  
  const [pageTitle, setPageTitle] = useState(label || '');
  const [fullDoc, setFullDoc] = useState<any>(null);

  useEffect(() => {
      // Group Logic
      if (elementIds && elementIds.length > 0 && pageId) {
          // Always fetch fresh data to support live updates
          pageService.getById(pageId).then(page => {
              if (page && page.type === 'original_normativo' && page.entity) {
                  setFullDoc(page.entity);
                  setPageTitle(page.title);
                  
                  // Rebuild groupData from live doc
                  const elements: any[] = [];
                  const selectedSet = new Set(elementIds);
                  const docElements = (page.entity as any).elements || [];

                  docElements.forEach((el: any) => {
                      if (selectedSet.has(el.id)) {
                          const segments = segmentsMap?.[el.id];
                          elements.push({
                              ...el,
                              segments: segments
                          });
                      }
                  });
                  
                  setGroupData(elements);
              }
          });
          return;
      }

      // Single Logic (Legacy/Fallback)
      if (text) return; 
      if (pageId && elementId && elementId !== 'root') {
          pageService.getById(pageId).then(page => {
              if (page && page.type === 'original_normativo' && page.entity) {
                  setPageTitle(page.title);
                  const el = (page.entity as any).elements?.find((e: any) => e.id === elementId);
                  if (el) {
                      setData({
                          pageId: page.id,
                          pageTitle: page.title,
                          elementId: elementId,
                          type: el.type,
                          text: el.text 
                      });
                  }
              }
          });
      } else if (pageId && elementId === 'root') {
          pageService.getById(pageId).then(page => {
              if (page) {
                  setPageTitle(page.title);
                  setData({
                      pageId: page.id,
                      pageTitle: page.title,
                      elementId: 'root',
                      type: 'Documento',
                      text: (page.entity as any)?.ementa || page.title
                  });
              }
          });
      }
  }, [pageId, elementId, elementIds, text, segmentsMap]);

    const renderItemContent = (item: any) => {
      if (item.type === 'Gap') {
          return <div className="text-muted-foreground my-2 font-mono text-sm tracking-widest pl-8">[...]</div>;
      }

      let displayElement = item;
      const itemSegments = item.segments || segmentsMap?.[item.id];
      const key = getElementKey(item as any);
      const cleanText = getCleanDisplayText(item.text || '', item.type, item.index);
      
      if (itemSegments) {
          const newText = processTextWithSegments(cleanText, itemSegments, key);
          displayElement = { ...item, text: newText };
      } else {
          displayElement = { ...item, text: cleanText };
      }

      // Reuse ElementContent for consistent rendering (styles, keys, strikethrough, etc.)
      return (
          <div className="text-foreground/90 leading-relaxed font-serif text-justify">
              <ElementContent 
                  element={displayElement} 
                  noteMap={new Map()} 
                  viewMode="full" 
              />
          </div>
      );
  };

  // Render Group
  if (elementIds && elementIds.length > 0) {
      return (
        <NodeViewWrapper className="border-l-4 border-primary/30 pl-4 py-2 my-4 select-none group relative">
            {/* Edit Button */}
            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-background/80 p-1 rounded">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => editor.storage.reference.onEdit?.(node, getPos)}
                    title="Editar Vínculo"
                >
                    <Edit className="h-3 w-3" />
                </Button>
            </div>

            {fullDoc ? (
                <NormativeListHeader doc={fullDoc} showLink={false} elementIds={elementIds} />
            ) : (
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex justify-between">
                    <span>{pageTitle || 'Carregando...'}</span>
                </div>
            )}
            
            <div className="space-y-4">
                {groupData.length > 0 ? (
                    processGapsUnified(groupData as any, fullDoc?.elements || []).map((item: any, itemIdx: number) => (
                        <div key={item.id || itemIdx}>{renderItemContent(item)}</div>
                    ))
                ) : (
                    <span className="italic text-muted-foreground text-sm">Carregando conteúdo...</span>
                )}
            </div>
        </NodeViewWrapper>
      );
  }

  // Render Single (Legacy)
  return (
    <NodeViewWrapper className="border-l-4 border-primary/30 pl-4 py-2 my-4 select-none group relative">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex justify-between">
            <span>{pageTitle || data?.pageTitle || 'Referência'}</span>
        </div>
        
        {/* Edit Button (Legacy support) */}
        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-background/80 p-1 rounded">
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={() => editor.storage.reference.onEdit?.(node, getPos)}
                title="Editar Vínculo"
            >
                <Edit className="h-3 w-3" />
            </Button>
        </div>

        <div className="text-foreground/90 leading-relaxed font-serif text-justify">
            {data?.text ? (
                <div dangerouslySetInnerHTML={{ __html: data.text }} />
            ) : (
                <span className="italic text-muted-foreground">Carregando conteúdo...</span>
            )}
        </div>
    </NodeViewWrapper>
  );
};

export const ReferenceExtension = Node.create({
  name: 'reference',
  group: 'block',
  atom: true,

  addStorage() {
    return {
      onEdit: null,
    };
  },

  addAttributes() {
    return {
      pageId: { default: null },
      elementId: { default: null },
      elementIds: { default: null }, // Array of IDs
      groupedElements: { default: null }, // Preloaded content
      label: { default: null },
      text: { default: null }, // HTML content
      segmentsMap: { default: null }, // Map of segments per element
    };
  },

  parseHTML() {
    return [{ tag: 'reference-node' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['reference-node', HTMLAttributes];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ReferenceComponent) as any;
  },
});
