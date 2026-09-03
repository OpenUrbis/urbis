import { Extension } from "@tiptap/core";
import {
  Fragment,
  Node as ProseMirrorNode,
  type NodeRange,
} from "@tiptap/pm/model";
import {
  TextSelection,
  type Command,
  type EditorState,
  type Transaction,
} from "@tiptap/pm/state";
import {
  defaultPasteLineBreaksOptions,
  splitLineBreaksInFragment,
  type PasteLineBreaksOptions,
} from "./paste-line-breaks";

/**
 * Manual controls for the block ↔ normative element boundary.
 *
 * Every top-level textblock becomes one normative element, so "join these lines
 * into a single article" and "break this block into one element per line" are
 * editing operations users need on demand — not only through the document-wide
 * auto format:
 *
 * - `mergeSelectedBlocks` (Shift+Enter over a multi-block selection): keeps the
 *   first block (and its `normativeId`) and pulls the following blocks into it,
 *   separated by `hardBreak` — exactly what a Shift+Enter line break means.
 * - `splitSelectedBlockLines` (Ctrl/Cmd+Shift+Enter): the inverse, turning every
 *   line break inside the selected blocks into a sibling block.
 */

/** Manual splits keep the author's spacing; only pasted content gets cleaned up. */
const MANUAL_SPLIT_OPTIONS: PasteLineBreaksOptions = {
  ...defaultPasteLineBreaksOptions,
  collapseWhitespace: false,
};

function isMergeableTextblock(node: ProseMirrorNode) {
  return (
    node.isTextblock &&
    node.type.spec.code !== true &&
    node.type.spec.whitespace !== "pre"
  );
}

/** Blocks of the selection that live side by side under the same parent. */
function selectedBlockRange(state: EditorState): NodeRange | null {
  const { $from, $to } = state.selection;
  return $from.blockRange($to);
}

function blocksInRange(range: NodeRange) {
  const blocks: ProseMirrorNode[] = [];
  for (let index = range.startIndex; index < range.endIndex; index += 1) {
    blocks.push(range.parent.child(index));
  }
  return blocks;
}

/** Selects the content written at `start`, so the result stays visible. */
function selectWrittenRange(tr: Transaction, start: number, size: number) {
  if (size < 2) return tr;

  try {
    return tr.setSelection(
      TextSelection.between(
        tr.doc.resolve(start + 1),
        tr.doc.resolve(start + size - 1),
      ),
    );
  } catch {
    return tr;
  }
}

/**
 * Joins the selected blocks into the first one, separated by line breaks.
 * Returns `false` when the selection touches a single block, so the default
 * Shift+Enter behaviour (insert a line break) still runs.
 */
export const mergeSelectedBlocks: Command = (state, dispatch) => {
  const range = selectedBlockRange(state);
  if (!range || range.endIndex - range.startIndex < 2) return false;

  const blocks = blocksInRange(range);
  if (!blocks.every(isMergeableTextblock)) return false;

  const target = blocks[0];
  const hardBreak = state.schema.nodes.hardBreak;

  let content = target.content;
  blocks.slice(1).forEach((block) => {
    if (!block.content.size) return;

    if (content.size) {
      content = content.addToEnd(
        hardBreak ? hardBreak.create() : state.schema.text(" "),
      );
    }

    content = content.append(block.content);
  });

  if (!target.type.validContent(content)) return false;

  const merged = target.type.create(target.attrs, content, target.marks);
  if (!dispatch) return true;

  const tr = state.tr.replaceWith(range.start, range.end, merged);
  dispatch(
    selectWrittenRange(tr, range.start, merged.nodeSize).scrollIntoView(),
  );

  return true;
};

/**
 * Breaks every line break inside the selected blocks (or the block under the
 * cursor) into its own block, so each line becomes its own normative element.
 */
export function splitSelectedBlockLines(
  options: PasteLineBreaksOptions = MANUAL_SPLIT_OPTIONS,
): Command {
  return (state, dispatch) => {
    const range = selectedBlockRange(state);
    if (!range) return false;

    const blocks = Fragment.fromArray(blocksInRange(range));
    const split = splitLineBreaksInFragment(blocks, options);
    if (split === blocks) return false;

    if (!dispatch) return true;

    const tr = state.tr.replaceWith(range.start, range.end, split);
    dispatch(selectWrittenRange(tr, range.start, split.size).scrollIntoView());

    return true;
  };
}

declare module "@tiptap/core" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Commands<ReturnType> {
    blockLines: {
      /** Joins the selected blocks into a single normative element. */
      mergeSelectedBlocks: () => ReturnType;
      /** Splits the selected blocks on every line break. */
      splitSelectedBlockLines: () => ReturnType;
    };
  }
}

export const BlockLines = Extension.create({
  name: "blockLines",

  // Runs before HardBreak so Shift+Enter can merge a multi-block selection and
  // fall through to the default line break otherwise.
  priority: 1000,

  addCommands() {
    return {
      mergeSelectedBlocks:
        () =>
        ({ state, dispatch }) =>
          mergeSelectedBlocks(state, dispatch),
      splitSelectedBlockLines:
        () =>
        ({ state, dispatch }) =>
          splitSelectedBlockLines()(state, dispatch),
    };
  },

  addKeyboardShortcuts() {
    return {
      "Shift-Enter": () => this.editor.commands.mergeSelectedBlocks(),
      "Mod-Shift-Enter": () => this.editor.commands.splitSelectedBlockLines(),
    };
  },
});
