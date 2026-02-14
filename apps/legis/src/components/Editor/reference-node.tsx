import React, { useEffect, useState } from 'react';
import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { pageService, NormativeSearchResult } from '../../services/page-service';

const ReferenceComponent = ({ node }: any) => {
  const { pageId, elementId } = node.attrs;
  const [data, setData] = useState<NormativeSearchResult | null>(null);

  useEffect(() => {
      if (pageId && elementId) {
          const parts = elementId.split('-block-');
          if (parts.length < 2) return;
          const blockIdx = parseInt(parts[1]);
          
          pageService.getById(pageId).then(page => {
              if (page) {
                  try {
                      const json = JSON.parse(page.content);
                      let currentIdx = 0;
                      let found = null;
                      const traverse = (n: any) => {
                          if (n.type === 'paragraph' || n.type === 'heading') {
                              if (currentIdx === blockIdx) found = n;
                              currentIdx++;
                          } else if (n.content) {
                              n.content.forEach(traverse);
                          }
                      };
                      if (json) traverse(json);
                      
                      if (found) {
                          const text = (found as any).content?.map((c: any) => c.text).join('') || '';
                          setData({
                              pageId: page.id,
                              pageTitle: page.title,
                              elementId: elementId,
                              type: 'Ref',
                              text: text
                          });
                      }
                  } catch {}
              }
          });
      }
  }, [pageId, elementId]);

  return (
    <NodeViewWrapper className="border-l-4 border-blue-500 bg-blue-50/50 p-4 rounded my-4 select-none cursor-pointer hover:bg-blue-100/50 transition-colors">
        <div className="text-xs text-blue-600 font-bold mb-1 flex justify-between">
            <span>Referência: {data?.pageTitle || 'Carregando...'}</span>
            <span className="text-[10px] opacity-70">Vínculo Dinâmico</span>
        </div>
        <div className="text-sm italic text-muted-foreground line-clamp-3">
            {data?.text || 'Conteúdo não encontrado ou carregando...'}
        </div>
    </NodeViewWrapper>
  );
};

export const ReferenceExtension = Node.create({
  name: 'reference',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      pageId: { default: null },
      elementId: { default: null },
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
