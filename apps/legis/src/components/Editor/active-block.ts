import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const ActiveBlock = Extension.create({
  name: 'activeBlock',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('activeBlock'),
        props: {
          decorations: ({ doc, selection }) => {
            // We want to highlight the block where the selection is.
            const { anchor } = selection;
            
            // Resolve position to find the block
            const $pos = doc.resolve(anchor);
            
            // Find the depth of the block (usually 1 for top-level paragraphs)
            // But we want the immediate parent of the text node usually.
            // Or the deepest block node.
            // Let's try to find the node at depth 1 (or direct child of doc) or recursively?
            // Actually, we usually want the paragraph/heading the cursor is in.
            
            // $pos.depth is the depth of the cursor.
            // We want the node at $pos.depth if it's a block, or $pos.depth - 1.
            let depth = $pos.depth;
            let node = $pos.node(depth);
            while (depth > 0 && !node.isBlock) {
                depth--;
                node = $pos.node(depth);
            }

            if (!node || !node.isBlock || depth <= 0) return DecorationSet.empty;

            // Create decoration
            // Note: Decoration.node applies to the node itself.
            // Decoration.inline applies to text.
            // For block styling, Decoration.node is best but requires exact node boundaries match?
            // Actually Decoration.node(from, to, attrs) works if from/to match a node.
            // $pos.before(depth) gives the pos before the node.
            
            const nodePos = $pos.before(depth);
            
            return DecorationSet.create(doc, [
              Decoration.node(nodePos, nodePos + node.nodeSize, {
                class: 'active-block',
              }),
            ]);
          },
        },
      }),
    ];
  },
});
