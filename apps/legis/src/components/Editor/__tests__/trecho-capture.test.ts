import { describe, expect, it } from "vitest";
import { readSelectionInElement } from "../trecho-capture";

/**
 * Minimal ProseMirror-shaped stub. Building a real schema here would drag the
 * whole Tiptap stack into the test for behaviour that only depends on positions,
 * node attributes and `textBetween`.
 *
 * Layout: two sibling paragraphs, each wrapping its text in one node.
 *   doc: [ p(el-1, "Primeiro artigo.") , p(el-2, "Segundo artigo.") ]
 */
const FIRST_TEXT = "Primeiro artigo.";
const SECOND_TEXT = "Segundo artigo.";

const FIRST_POS = 0;
const FIRST_SIZE = FIRST_TEXT.length + 2;
const SECOND_POS = FIRST_POS + FIRST_SIZE;

interface StubNode {
  attrs: Record<string, unknown>;
  nodeSize: number;
  text: string;
  pos: number;
  /** Mirrors `ProseMirrorNode.descendants` for a node holding one text run. */
  descendants: (fn: (child: unknown, pos: number) => boolean | void) => void;
}

function makeNode(
  normativeId: string,
  index: string,
  text: string,
  pos: number,
): StubNode {
  return {
    attrs: { normativeId, type: "Artigo", index },
    nodeSize: text.length + 2,
    text,
    pos,
    descendants: (fn) => {
      fn({ isText: true, text }, 0);
    },
  };
}

const FIRST_NODE = makeNode("el-1", "1º", FIRST_TEXT, FIRST_POS);
const SECOND_NODE = makeNode("el-2", "2º", SECOND_TEXT, SECOND_POS);

const NODES = [FIRST_NODE, SECOND_NODE];

function nodeAt(pos: number): StubNode {
  return (
    NODES.find((node) => pos >= node.pos && pos < node.pos + node.nodeSize) ??
    FIRST_NODE
  );
}

/** Concatenated text of the document, addressed by document position. */
function textBetween(from: number, to: number): string {
  let out = "";

  NODES.forEach((node) => {
    const textStart = node.pos + 1;
    const textEnd = textStart + node.text.length;
    const sliceStart = Math.max(from, textStart);
    const sliceEnd = Math.min(to, textEnd);
    if (sliceEnd <= sliceStart) return;
    out += node.text.slice(sliceStart - textStart, sliceEnd - textStart);
  });

  return out;
}

function makeEditor(from: number, to: number) {
  return {
    state: {
      selection: { from, to, empty: from === to },
      doc: {
        textBetween: (a: number, b: number) => textBetween(a, b),
        resolve: (pos: number) => {
          const node = nodeAt(pos);
          return {
            depth: 1,
            node: (depth: number) => (depth === 1 ? node : node),
            before: () => node.pos,
          };
        },
        descendants: (fn: (node: unknown, pos: number) => boolean) => {
          NODES.forEach((node) => fn(node, node.pos));
        },
      },
    },
  };
}

const FIRST_TEXT_START = FIRST_POS + 1;
const SECOND_TEXT_START = SECOND_POS + 1;

describe("readSelectionInElement", () => {
  it("captures a selection made inside the element", () => {
    const editor = makeEditor(FIRST_TEXT_START, FIRST_TEXT_START + 8);
    const outcome = readSelectionInElement(editor, "el-1", FIRST_TEXT);

    expect(outcome.status).toBe("captured");
    if (outcome.status !== "captured") return;
    expect(outcome.selectedText).toBe("Primeiro");
    expect(outcome.truncated).toBe(false);
  });

  it("rejects a selection that belongs to another element", () => {
    const editor = makeEditor(SECOND_TEXT_START, SECOND_TEXT_START + 7);
    const outcome = readSelectionInElement(editor, "el-1", FIRST_TEXT);

    expect(outcome).toEqual({ status: "outside", elementId: "el-2" });
  });

  it("clips a selection that starts inside and runs past the element", () => {
    // Regression: only the start of the selection identified the element, so a
    // drag past its end captured text from the following elements.
    const editor = makeEditor(FIRST_TEXT_START + 9, SECOND_TEXT_START + 7);
    const outcome = readSelectionInElement(editor, "el-1", FIRST_TEXT);

    expect(outcome.status).toBe("captured");
    if (outcome.status !== "captured") return;
    expect(outcome.selectedText).toBe("artigo.");
    expect(outcome.selectedText).not.toContain("Segundo");
    expect(outcome.truncated).toBe(true);
  });

  it("never returns text from outside the element", () => {
    const editor = makeEditor(
      FIRST_TEXT_START,
      SECOND_TEXT_START + SECOND_TEXT.length,
    );
    const outcome = readSelectionInElement(editor, "el-1", FIRST_TEXT);

    expect(outcome.status).toBe("captured");
    if (outcome.status !== "captured") return;
    expect(outcome.selectedText).toBe(FIRST_TEXT);
    expect(outcome.truncated).toBe(true);
  });

  it("treats an empty selection as nothing to capture", () => {
    const outcome = readSelectionInElement(
      makeEditor(FIRST_TEXT_START, FIRST_TEXT_START),
      "el-1",
      FIRST_TEXT,
    );

    expect(outcome).toEqual({ status: "empty" });
  });

  it("accepts any element when no expectation is given", () => {
    const editor = makeEditor(SECOND_TEXT_START, SECOND_TEXT_START + 7);
    const outcome = readSelectionInElement(editor, undefined, SECOND_TEXT);

    expect(outcome.status).toBe("captured");
    if (outcome.status !== "captured") return;
    expect(outcome.elementId).toBe("el-2");
  });

  it("reports an offset hint relative to the element text", () => {
    const editor = makeEditor(FIRST_TEXT_START + 9, FIRST_TEXT_START + 16);
    const outcome = readSelectionInElement(editor, "el-1", FIRST_TEXT);

    expect(outcome.status).toBe("captured");
    if (outcome.status !== "captured") return;
    expect(FIRST_TEXT.slice(outcome.hintOffset, outcome.hintOffset + 7)).toBe(
      "artigo.",
    );
  });

  it("returns empty without an editor", () => {
    expect(readSelectionInElement(null, "el-1")).toEqual({ status: "empty" });
  });
});
