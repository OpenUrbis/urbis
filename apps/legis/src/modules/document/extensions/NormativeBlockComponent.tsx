import React from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { cn } from '@open-urbis/map-ui';
import { Link2 } from 'lucide-react';

export const NormativeBlockComponent = (props: any) => {
  const { node, selected } = props;
  const { type, index, linkedDocumentId } = node.attrs;

  const getIndentation = () => {
    switch (type) {
        case 'Inciso': return 'pl-8';
        case 'Alínea': return 'pl-16';
        case 'Item': return 'pl-24';
        case 'Parágrafo': return 'pl-4';
        default: return '';
    }
  };

  const getPrefix = () => {
    if (type === 'Artigo') return `Art. ${index} `;
    if (type === 'Parágrafo') return index === 'único' ? 'Parágrafo único. ' : `§ ${index} `;
    if (type === 'Inciso') return `${index} - `;
    if (type === 'Alínea') return `${index}) `;
    if (type === 'Item') return `${index}. `;
    return '';
  };

  return (
    <NodeViewWrapper className={cn(
        "group relative py-1 rounded transition-colors", 
        getIndentation(),
        selected ? "bg-muted/30 ring-1 ring-border" : "hover:bg-muted/10"
    )}>
      <div className="flex items-start gap-2">
        <div className="flex-1 font-serif text-lg leading-relaxed text-justify flex gap-1">
           {/* Non-editable prefix */}
           <span className="font-bold text-foreground/80 select-none" contentEditable={false}>
                {getPrefix()}
           </span>
           
           {/* Editable Content */}
           <NodeViewContent className="flex-1 outline-none" />
        </div>
        
        {/* Link Indicator */}
        {linkedDocumentId && (
            <div className="text-primary cursor-pointer" title="Vinculado a documento original" contentEditable={false}>
                <Link2 size={16} />
            </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};
