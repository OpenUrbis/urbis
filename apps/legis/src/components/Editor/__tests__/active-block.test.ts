import { describe, expect, it } from "vitest";
import { Fragment, Node as ProseMirrorNode, Schema } from "@tiptap/pm/model";
import {
  AllSelection,
  EditorState,
  NodeSelection,
  Plugin,
  TextSelection,
} from "@tiptap/pm/state";
import { DecorationSet } from "@tiptap/pm/view";
import { ActiveBlock } from "../active-block";

/**
 * The extension only reads document positions out of the selection and returns a
 * node decoration, so it can be exercised with a plain ProseMirror state — no
 * editor view, no DOM.
 */
const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { content: "inline*", group: "block" },
    heading: {
      content: "inline*",
      group: "block",
      attrs: { level: { default: 1 } },
    },
    blockquote: { content: "block+", group: "block" },
    horizontalRule: { group: "block" },
    text: { group: "inline" },
  },
});

const { doc, paragraph, heading, blockquote, horizontalRule } = schema.nodes;

function paragraphOf(text: string) {
  return paragraph.create(null, text ? schema.text(text) : null);
}

function docOf(blocks: ProseMirrorNode[]) {
  return doc.create(null, Fragment.fromArray(blocks));
}

/** Shape of the node decorations built by the extension. */
interface NodeDecoration {
  from: number;
  to: number;
  inline: boolean;
  type: { attrs?: Record<string, string> };
}

const plugins = (
  ActiveBlock.config.addProseMirrorPlugins as unknown as () => Plugin[]
)();

const decorationsOf = plugins[0].props.decorations as unknown as (
  state: EditorState,
) => DecorationSet;

function decorate(state: EditorState): NodeDecoration[] {
  return decorationsOf(state).find() as unknown as NodeDecoration[];
}

/** Cursor `offset` characters into the block at `index`. */
function withCursor(blocks: ProseMirrorNode[], index: number, offset = 0) {
  const document = docOf(blocks);
  let pos = 1;

  document.forEach((_node, nodeOffset, childIndex) => {
    if (childIndex === index) pos = nodeOffset + 1 + offset;
  });

  return EditorState.create({
    doc: document,
    selection: TextSelection.create(document, pos),
  });
}

const FIRST = "Art. 1º - Fica instituído o Plano Diretor.";
const SECOND = "Art. 2º - Esta lei entra em vigor.";

describe("ActiveBlock", () => {
  it("registers a single plugin under its own name", () => {
    expect(ActiveBlock.name).toBe("activeBlock");
    expect(plugins).toHaveLength(1);
    expect(plugins[0].props.decorations).toBeTypeOf("function");
  });

  it("highlights the block holding the cursor, spanning it exactly", () => {
    const state = withCursor([paragraphOf(FIRST), paragraphOf(SECOND)], 0, 3);
    const [decoration, ...rest] = decorate(state);

    expect(rest).toHaveLength(0);
    expect(decoration.from).toBe(0);
    expect(decoration.to).toBe(FIRST.length + 2);
    expect(decoration.inline).toBe(false);
    expect(decoration.type.attrs?.class).toBe("active-block");
  });

  it("moves the highlight to the block the cursor is in", () => {
    const blocks = [paragraphOf(FIRST), paragraphOf(SECOND)];
    const secondStart = FIRST.length + 2;

    expect(decorate(withCursor(blocks, 1, 5))).toEqual([
      expect.objectContaining({
        from: secondStart,
        to: secondStart + SECOND.length + 2,
      }),
    ]);
  });

  it("gives the same decoration for every cursor position inside a block", () => {
    const blocks = [paragraphOf(FIRST), paragraphOf(SECOND)];
    const atStart = decorate(withCursor(blocks, 0, 0))[0];
    const atEnd = decorate(withCursor(blocks, 0, FIRST.length))[0];

    expect([atStart.from, atStart.to]).toEqual([atEnd.from, atEnd.to]);
  });

  it("highlights an empty block too", () => {
    const [decoration] = decorate(withCursor([paragraphOf("")], 0));

    expect([decoration.from, decoration.to]).toEqual([0, 2]);
  });

  it("highlights any kind of block, not only paragraphs", () => {
    const title = "CAPÍTULO I";
    const [decoration] = decorate(
      withCursor([heading.create({ level: 2 }, schema.text(title))], 0, 2),
    );

    expect([decoration.from, decoration.to]).toEqual([0, title.length + 2]);
  });

  it("highlights the innermost block of a nested structure", () => {
    const quoted = "Fica revogado o art. 5º.";
    const state = withCursor(
      [blockquote.create(null, paragraphOf(quoted))],
      0,
      1,
    );

    // Position 1 is the paragraph inside the blockquote, whose own start is 0.
    expect(decorate(state)).toEqual([
      expect.objectContaining({ from: 1, to: 1 + quoted.length + 2 }),
    ]);
  });

  it("follows the anchor of a selection that spans several blocks", () => {
    const blocks = [paragraphOf(FIRST), paragraphOf(SECOND)];
    const document = docOf(blocks);
    const secondStart = FIRST.length + 2;
    const state = EditorState.create({
      doc: document,
      // Anchor in the second block, head in the first one.
      selection: TextSelection.create(document, secondStart + 5, 5),
    });

    expect(decorate(state)).toEqual([
      expect.objectContaining({
        from: secondStart,
        to: secondStart + SECOND.length + 2,
      }),
    ]);
  });

  it("highlights nothing when the whole document is selected", () => {
    const document = docOf([paragraphOf(FIRST), paragraphOf(SECOND)]);
    const state = EditorState.create({
      doc: document,
      selection: new AllSelection(document),
    });

    expect(decorate(state)).toEqual([]);
  });

  it("highlights nothing for a node selection", () => {
    // Documents current behaviour: a node selection anchors at the position
    // before the node, which resolves to the document itself (depth 0).
    const document = docOf([paragraphOf(FIRST), horizontalRule.create()]);
    const state = EditorState.create({
      doc: document,
      selection: NodeSelection.create(document, 0),
    });

    expect(decorate(state)).toEqual([]);
    expect(decorationsOf(state)).toBe(DecorationSet.empty);
  });
});
