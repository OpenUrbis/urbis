import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { NormativeBlockComponent } from './NormativeBlockComponent';

export interface NormativeAttributes {
  id: string;
  type: string;
  index: string;
  text: string; // Redundant if using content, but kept for metadata
  linkedDocumentId?: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    normative: {
      setNormative: (attributes: NormativeAttributes) => ReturnType;
    };
  }
}

export const NormativeExtension = Node.create({
  name: 'normative',

  group: 'block',

  content: 'inline*', // Allow inline content (text) inside

  draggable: true,

  addAttributes() {
    return {
      id: {
        default: null,
      },
      type: {
        default: 'Texto',
      },
      index: {
        default: null,
      },
      linkedDocumentId: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'normative-block',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['normative-block', mergeAttributes(HTMLAttributes), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(NormativeBlockComponent);
  },

  addCommands() {
    return {
      setNormative:
        (attributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
            content: [{ type: 'text', text: attributes.text }],
          });
        },
    };
  },
});
