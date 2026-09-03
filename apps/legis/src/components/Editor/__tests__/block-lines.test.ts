import { describe, expect, it } from "vitest";
import { Fragment, Node as ProseMirrorNode, Schema } from "@tiptap/pm/model";
import { EditorState, TextSelection, AllSelection } from "@tiptap/pm/state";
import { mergeSelectedBlocks, splitSelectedBlockLines } from "../block-lines";

const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: {
      content: "inline*",
      group: "block",
      attrs: { normativeId: { default: null }, type: { default: null } },
    },
    heading: {
      content: "inline*",
      group: "block",
      attrs: { level: { default: 1 }, normativeId: { default: null } },
    },
    codeBlock: {
      content: "text*",
      group: "block",
      code: true,
      marks: "",
      whitespace: "pre",
    },
    image: { inline: false, group: "block", attrs: { src: { default: "" } } },
    text: { group: "inline" },
    hardBreak: { inline: true, group: "inline", selectable: false },
  },
  marks: { strong: {} },
});

const { doc, paragraph, heading, codeBlock, image, hardBreak } = schema.nodes;
const { strong } = schema.marks;

function paragraphOf(text: string, attrs?: Record<string, unknown>) {
  return paragraph.create(attrs, text ? schema.text(text) : null);
}

function stateOf(blocks: ProseMirrorNode[]) {
  return EditorState.create({
    doc: doc.create(null, Fragment.fromArray(blocks)),
  });
}

/** Selection spanning from inside the first block to inside the last one. */
function selectBlocks(state: EditorState, fromIndex: number, toIndex: number) {
  let start = 0;
  let end = 0;

  state.doc.forEach((node, offset, index) => {
    if (index === fromIndex) start = offset + 1;
    if (index === toIndex) end = offset + node.nodeSize - 1;
  });

  return state.apply(
    state.tr.setSelection(TextSelection.create(state.doc, start, end)),
  );
}

function selectEverything(state: EditorState) {
  return state.apply(state.tr.setSelection(new AllSelection(state.doc)));
}

function selectCursorIn(state: EditorState, index: number) {
  let pos = 1;
  state.doc.forEach((_node, offset, childIndex) => {
    if (childIndex === index) pos = offset + 1;
  });

  return state.apply(
    state.tr.setSelection(TextSelection.create(state.doc, pos)),
  );
}

/** Runs a command and returns the resulting document blocks, or null. */
function run(state: EditorState, command: ReturnType<typeof commandOf>) {
  let next: EditorState | null = null;
  const handled = command(state, (tr) => {
    next = state.apply(tr);
  });

  return { handled, state: next as EditorState | null };
}

function commandOf(kind: "merge" | "split") {
  return kind === "merge" ? mergeSelectedBlocks : splitSelectedBlockLines();
}

function blocksOf(state: EditorState) {
  const blocks: ProseMirrorNode[] = [];
  state.doc.forEach((node) => blocks.push(node));
  return blocks;
}

describe("mergeSelectedBlocks", () => {
  it("joins the selected blocks into the first one, separated by line breaks", () => {
    const initial = selectBlocks(
      stateOf([
        paragraphOf("Art. 1º - Fica autorizado o Executivo a:"),
        paragraphOf("I - firmar convênios;"),
        paragraphOf("II - conceder incentivos."),
        paragraphOf("Art. 2º - Esta lei entra em vigor."),
      ]),
      0,
      2,
    );

    const { handled, state } = run(initial, commandOf("merge"));
    expect(handled).toBe(true);

    const blocks = blocksOf(state!);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].childCount).toBe(5); // 3 lines + 2 hardBreaks
    expect(blocks[0].child(1).type.name).toBe("hardBreak");
    expect(blocks[1].textContent).toBe("Art. 2º - Esta lei entra em vigor.");
  });

  it("keeps the first block's type and normativeId", () => {
    const initial = selectBlocks(
      stateOf([
        heading.create(
          { level: 2, normativeId: "head-1" },
          schema.text("CAPÍTULO I"),
        ),
        paragraphOf("Das disposições preliminares", { normativeId: "par-1" }),
      ]),
      0,
      1,
    );

    const { state } = run(initial, commandOf("merge"));
    const merged = blocksOf(state!)[0];

    expect(merged.type.name).toBe("heading");
    expect(merged.attrs.normativeId).toBe("head-1");
    expect(merged.attrs.level).toBe(2);
  });

  it("preserves marks of the merged blocks", () => {
    const initial = selectBlocks(
      stateOf([
        paragraphOf("Seção I"),
        paragraph.create(null, schema.text("Do objeto", [strong.create()])),
      ]),
      0,
      1,
    );

    const { state } = run(initial, commandOf("merge"));
    const merged = blocksOf(state!)[0];

    expect(merged.lastChild?.marks.map((mark) => mark.type.name)).toEqual([
      "strong",
    ]);
  });

  it("does not add a line break for empty blocks", () => {
    const initial = selectBlocks(
      stateOf([
        paragraphOf("primeiro"),
        paragraphOf(""),
        paragraphOf("segundo"),
      ]),
      0,
      2,
    );

    const { state } = run(initial, commandOf("merge"));
    const merged = blocksOf(state!)[0];

    expect(merged.childCount).toBe(3);
    expect(
      merged.content.content.filter((node) => node.type === hardBreak),
    ).toHaveLength(1);
  });

  it("selects the merged block so it stays visible", () => {
    const initial = selectBlocks(
      stateOf([paragraphOf("linha um"), paragraphOf("linha dois")]),
      0,
      1,
    );

    const { state } = run(initial, commandOf("merge"));

    expect(state!.selection.empty).toBe(false);
    expect(
      state!.doc.textBetween(state!.selection.from, state!.selection.to),
    ).toContain("linha um");
  });

  it("declines a single-block selection so Shift+Enter keeps inserting a break", () => {
    const initial = selectBlocks(stateOf([paragraphOf("Art. 1º")]), 0, 0);

    expect(run(initial, commandOf("merge")).handled).toBe(false);
  });

  it("declines when the selection includes a non-textblock", () => {
    const initial = selectEverything(
      stateOf([paragraphOf("Figura 1"), image.create({ src: "a.png" })]),
    );

    expect(
      initial.selection.$from.blockRange(initial.selection.$to)?.endIndex,
    ).toBe(2);
    expect(run(initial, commandOf("merge")).handled).toBe(false);
  });

  it("declines when the selection includes a code block", () => {
    const initial = selectBlocks(
      stateOf([
        paragraphOf("exemplo"),
        codeBlock.create(null, schema.text("a\nb")),
      ]),
      0,
      1,
    );

    expect(run(initial, commandOf("merge")).handled).toBe(false);
  });

  it("reports feasibility without touching the document when there is no dispatch", () => {
    const initial = selectBlocks(
      stateOf([paragraphOf("um"), paragraphOf("dois")]),
      0,
      1,
    );

    expect(mergeSelectedBlocks(initial, undefined)).toBe(true);
    expect(initial.doc.childCount).toBe(2);
  });
});

describe("splitSelectedBlockLines", () => {
  it("splits the block under the cursor on its line breaks", () => {
    const initial = selectCursorIn(
      stateOf([
        paragraph.create({ normativeId: "el-1" }, [
          schema.text("Art. 1º - Do objeto."),
          hardBreak.create(),
          schema.text("Parágrafo único - Da exceção."),
        ]),
      ]),
      0,
    );

    const { handled, state } = run(initial, commandOf("split"));
    expect(handled).toBe(true);

    const blocks = blocksOf(state!);
    expect(blocks.map((block) => block.textContent)).toEqual([
      "Art. 1º - Do objeto.",
      "Parágrafo único - Da exceção.",
    ]);
    expect(blocks[0].attrs.normativeId).toBe("el-1");
    expect(blocks[1].attrs.normativeId).toBeNull();
  });

  it("splits literal newlines left behind by an old paste", () => {
    const initial = selectCursorIn(
      stateOf([paragraphOf("I - do objeto;\nII - das definições;")]),
      0,
    );

    const { state } = run(initial, commandOf("split"));

    expect(blocksOf(state!).map((block) => block.textContent)).toEqual([
      "I - do objeto;",
      "II - das definições;",
    ]);
  });

  it("splits every block touched by the selection", () => {
    const initial = selectBlocks(
      stateOf([
        paragraphOf("a\nb"),
        paragraphOf("c\nd"),
        paragraphOf("intocado\ntambém intocado"),
      ]),
      0,
      1,
    );

    const { state } = run(initial, commandOf("split"));
    const blocks = blocksOf(state!);

    expect(blocks.map((block) => block.textContent)).toEqual([
      "a",
      "b",
      "c",
      "d",
      "intocado\ntambém intocado",
    ]);
  });

  it("keeps the author's spacing when splitting manually", () => {
    const initial = selectCursorIn(stateOf([paragraphOf("a  b\nc  d")]), 0);

    const { state } = run(initial, commandOf("split"));

    expect(blocksOf(state!).map((block) => block.textContent)).toEqual([
      "a  b",
      "c  d",
    ]);
  });

  it("declines when the selected blocks have no line break", () => {
    const initial = selectBlocks(
      stateOf([paragraphOf("Art. 1º"), paragraphOf("Art. 2º")]),
      0,
      1,
    );

    expect(run(initial, commandOf("split")).handled).toBe(false);
  });

  it("never splits a code block", () => {
    const initial = selectCursorIn(
      stateOf([codeBlock.create(null, schema.text("linha 1\nlinha 2"))]),
      0,
    );

    expect(run(initial, commandOf("split")).handled).toBe(false);
  });

  it("survives a merge/split round trip", () => {
    const initial = selectBlocks(
      stateOf([
        paragraphOf("Art. 1º - Do objeto."),
        paragraphOf("Art. 2º - Da vigência."),
      ]),
      0,
      1,
    );

    const merged = run(initial, commandOf("merge")).state!;
    expect(merged.doc.childCount).toBe(1);

    const { state } = run(merged, commandOf("split"));

    expect(blocksOf(state!).map((block) => block.textContent)).toEqual([
      "Art. 1º - Do objeto.",
      "Art. 2º - Da vigência.",
    ]);
  });
});
