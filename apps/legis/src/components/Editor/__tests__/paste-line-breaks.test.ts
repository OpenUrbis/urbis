import { describe, expect, it } from "vitest";
import { Fragment, Schema, Slice } from "@tiptap/pm/model";
import {
  splitLineBreaksInFragment,
  splitLineBreaksInSlice,
  defaultPasteLineBreaksOptions,
} from "../paste-line-breaks";

/**
 * Minimal stand-in for the editor schema: same shapes that matter for pasting
 * (textblocks with normative attributes, hardBreak, a `whitespace: pre` block
 * and a nested block container).
 */
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
    blockquote: { content: "block+", group: "block" },
    text: { group: "inline" },
    hardBreak: {
      inline: true,
      group: "inline",
      selectable: false,
      linebreakReplacement: true,
    },
  },
  marks: { strong: {} },
});

const { paragraph, heading, codeBlock, blockquote, hardBreak } = schema.nodes;
const { strong } = schema.marks;

function paragraphOf(text: string, attrs?: Record<string, unknown>) {
  return paragraph.create(attrs, text ? schema.text(text) : null);
}

/** Readable view of the result: one entry per block. */
function textOf(fragment: Fragment) {
  const blocks: string[] = [];
  fragment.forEach((node) => blocks.push(node.textContent));
  return blocks;
}

function split(fragment: Fragment, options = defaultPasteLineBreaksOptions) {
  return splitLineBreaksInFragment(fragment, options);
}

describe("splitLineBreaksInFragment", () => {
  it("breaks a paragraph that kept literal newlines into one block per line", () => {
    const pasted = Fragment.from(
      paragraphOf(
        "Art. 1º - Fica criado o programa.\nArt. 2º - Esta lei entra em vigor.",
      ),
    );

    const result = split(pasted);

    expect(textOf(result)).toEqual([
      "Art. 1º - Fica criado o programa.",
      "Art. 2º - Esta lei entra em vigor.",
    ]);
    expect(result.child(0).type.name).toBe("paragraph");
  });

  it("handles CRLF, Word manual breaks and unicode separators", () => {
    const result = split(
      Fragment.from(paragraphOf("um\r\ndois\u000btrês\u2028quatro\rcinco")),
    );

    expect(textOf(result)).toEqual(["um", "dois", "três", "quatro", "cinco"]);
  });

  it("collapses consecutive breaks instead of creating empty blocks", () => {
    const result = split(
      Fragment.from(paragraphOf("\n\nprimeiro\n\n\nsegundo\n\n")),
    );

    expect(textOf(result)).toEqual(["primeiro", "segundo"]);
  });

  it("trims the indentation dragged along by white-space: pre sources", () => {
    const result = split(
      Fragment.from(
        paragraphOf("\tI -   do   objeto\n    II - das definições  "),
      ),
    );

    expect(textOf(result)).toEqual(["I - do objeto", "II - das definições"]);
  });

  it("keeps the raw spacing when collapsing is disabled", () => {
    const result = split(Fragment.from(paragraphOf("a  b\nc")), {
      ...defaultPasteLineBreaksOptions,
      collapseWhitespace: false,
    });

    expect(textOf(result)).toEqual(["a  b", "c"]);
  });

  it("breaks on hardBreak so <br> does not merge normative elements", () => {
    const pasted = Fragment.from(
      paragraph.create(null, [
        schema.text("Parágrafo único."),
        hardBreak.create(),
        schema.text("I - primeiro inciso."),
      ]),
    );

    expect(textOf(split(pasted))).toEqual([
      "Parágrafo único.",
      "I - primeiro inciso.",
    ]);
  });

  it("keeps hardBreaks when the option is disabled", () => {
    const pasted = Fragment.from(
      paragraph.create(null, [
        schema.text("linha um"),
        hardBreak.create(),
        schema.text("linha dois"),
      ]),
    );

    const result = split(pasted, {
      ...defaultPasteLineBreaksOptions,
      splitHardBreaks: false,
    });

    expect(result).toBe(pasted);
  });

  it("preserves marks across the split", () => {
    const pasted = Fragment.from(
      paragraph.create(null, [
        schema.text("CAPÍTULO I\nSeção I", [strong.create()]),
      ]),
    );

    const result = split(pasted);

    expect(textOf(result)).toEqual(["CAPÍTULO I", "Seção I"]);
    result.forEach((block) => {
      expect(block.firstChild?.marks.map((mark) => mark.type.name)).toEqual([
        "strong",
      ]);
    });
  });

  it("does not duplicate normativeId across the new blocks", () => {
    const result = split(
      Fragment.from(paragraphOf("Art. 1º\nArt. 2º", { normativeId: "abc" })),
    );

    expect(result.child(0).attrs.normativeId).toBe("abc");
    expect(result.child(1).attrs.normativeId).toBeNull();
  });

  it("keeps non-identity attributes on the new blocks", () => {
    const result = split(
      Fragment.from(paragraphOf("Art. 1º\nArt. 2º", { type: "Artigo" })),
    );

    expect(result.child(1).attrs.type).toBe("Artigo");
  });

  it("splits headings too", () => {
    const result = split(
      Fragment.from(
        heading.create({ level: 2 }, schema.text("Título\nSubtítulo")),
      ),
    );

    expect(textOf(result)).toEqual(["Título", "Subtítulo"]);
    expect(result.child(1).attrs.level).toBe(2);
  });

  it("never touches whitespace-preserving blocks", () => {
    const pasted = Fragment.from(codeBlock.create(null, schema.text("a\n  b")));

    expect(split(pasted)).toBe(pasted);
  });

  it("splits inside nested containers", () => {
    const pasted = Fragment.from(
      blockquote.create(null, paragraphOf("considerando A\nconsiderando B")),
    );

    const result = split(pasted);
    const quote = result.child(0);

    expect(quote.type.name).toBe("blockquote");
    expect(textOf(quote.content)).toEqual(["considerando A", "considerando B"]);
  });

  it("returns the same fragment when there is nothing to normalize", () => {
    const pasted = Fragment.fromArray([
      paragraphOf("Art. 1º"),
      paragraphOf("Art. 2º"),
    ]);

    expect(split(pasted)).toBe(pasted);
  });
});

describe("splitLineBreaksInSlice", () => {
  it("keeps the open depths so the paste still merges into the current block", () => {
    const slice = new Slice(
      Fragment.from(paragraphOf("linha 1\nlinha 2")),
      1,
      1,
    );

    const result = splitLineBreaksInSlice(slice);

    expect(result.openStart).toBe(1);
    expect(result.openEnd).toBe(1);
    expect(textOf(result.content)).toEqual(["linha 1", "linha 2"]);
  });

  it("leaves an untouched slice as-is", () => {
    const slice = new Slice(Fragment.from(paragraphOf("Art. 1º")), 1, 1);

    expect(splitLineBreaksInSlice(slice)).toBe(slice);
  });

  it("ignores an empty slice", () => {
    expect(splitLineBreaksInSlice(Slice.empty)).toBe(Slice.empty);
  });
});
