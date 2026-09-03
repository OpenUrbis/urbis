import { describe, expect, it } from "vitest";
import {
  baseRangeToDocRanges,
  docPosToBaseOffset,
  getCleanDisplayOffset,
  locateSegmentInNode,
  rawRangeToDocRanges,
  resolveBaseOffsetByContent,
  type NodeTextMapping,
} from "../node-text-mapping";

/**
 * A single-paragraph node: text starts at document position 1.
 * `visibleText` still carries the normative prefix, while the canonical base
 * text does not — that mismatch is what used to shift every decoration.
 */
const VISIBLE_TEXT =
  "Art. 1º - Fica criado o programa municipal de arborização.";
const BASE_TEXT = "Fica criado o programa municipal de arborização.";
const PREFIX_LENGTH = VISIBLE_TEXT.indexOf("Fica");

function makeMapping(
  baseOffset: number,
  visibleText = VISIBLE_TEXT,
): NodeTextMapping {
  return {
    visibleText,
    baseOffset,
    fragments: [
      {
        absoluteFrom: 1,
        absoluteTo: 1 + visibleText.length,
        rawStart: 0,
        rawEnd: visibleText.length,
      },
    ],
  };
}

/** Text covered by a document range, for readable assertions. */
function sliceDoc(
  mapping: NodeTextMapping,
  ranges: { from: number; to: number }[],
): string {
  return ranges
    .map(({ from, to }) => mapping.visibleText.slice(from - 1, to - 1))
    .join("");
}

describe("resolveBaseOffsetByContent", () => {
  it("finds where the canonical base text starts inside the node text", () => {
    expect(resolveBaseOffsetByContent(VISIBLE_TEXT, BASE_TEXT)).toBe(
      PREFIX_LENGTH,
    );
  });

  it("returns 0 when the node has no prefix", () => {
    expect(resolveBaseOffsetByContent(BASE_TEXT, BASE_TEXT)).toBe(0);
  });

  it("tolerates whitespace differences between the two pipelines", () => {
    expect(
      resolveBaseOffsetByContent(VISIBLE_TEXT, "Fica  criado\no programa"),
    ).toBe(PREFIX_LENGTH);
  });

  it("returns null when there is nothing to align", () => {
    expect(resolveBaseOffsetByContent(VISIBLE_TEXT, undefined)).toBeNull();
    expect(resolveBaseOffsetByContent("", BASE_TEXT)).toBeNull();
    expect(
      resolveBaseOffsetByContent(VISIBLE_TEXT, "texto que não existe aqui"),
    ).toBeNull();
  });
});

describe("getCleanDisplayOffset (attribute-based, kept as fallback)", () => {
  it("reproduces the bug: without attrs.type the prefix is not accounted for", () => {
    expect(getCleanDisplayOffset(VISIBLE_TEXT, { normativeId: "el-1" })).toBe(
      0,
    );
  });

  it("works when the attributes are present", () => {
    expect(
      getCleanDisplayOffset(VISIBLE_TEXT, { type: "Artigo", index: "1º" }),
    ).toBe(PREFIX_LENGTH);
  });
});

describe("locateSegmentInNode", () => {
  const segment = { start: 14, end: 22, selectedText: "programa" };

  it("lands on the right words even when the base offset is wrong", () => {
    // baseOffset 0 is what the attribute-based path produced for a freshly
    // structured node; the stored text rescues the position.
    const mapping = makeMapping(0);

    expect(sliceDoc(mapping, locateSegmentInNode(mapping, segment))).toBe(
      "programa",
    );
  });

  it("lands on the right words when the base offset is correct", () => {
    const mapping = makeMapping(PREFIX_LENGTH);

    expect(sliceDoc(mapping, locateSegmentInNode(mapping, segment))).toBe(
      "programa",
    );
  });

  it("never highlights the normative prefix", () => {
    const mapping = makeMapping(0);
    const ranges = locateSegmentInNode(mapping, segment);

    expect(Math.min(...ranges.map((range) => range.from))).toBeGreaterThan(
      PREFIX_LENGTH,
    );
  });

  it("uses the offset as a tie-breaker for repeated wording", () => {
    const repeated = "Art. 2º - O prazo é de 30 dias. O prazo é de 60 dias.";
    const mapping = makeMapping(repeated.indexOf("O prazo"), repeated);
    const secondOccurrence =
      repeated.lastIndexOf("O prazo") - mapping.baseOffset;

    const ranges = locateSegmentInNode(mapping, {
      start: secondOccurrence,
      end: secondOccurrence + 7,
      selectedText: "O prazo",
    });

    expect(ranges[0].from - 1).toBe(repeated.lastIndexOf("O prazo"));
  });

  it("falls back to arithmetic offsets for legacy segments without text", () => {
    const mapping = makeMapping(PREFIX_LENGTH);
    const ranges = locateSegmentInNode(mapping, { start: 14, end: 22 });

    expect(sliceDoc(mapping, ranges)).toBe("programa");
  });

  it("returns nothing for a collapsed range", () => {
    const mapping = makeMapping(PREFIX_LENGTH);

    expect(locateSegmentInNode(mapping, { start: 0, end: 0 })).toEqual([]);
  });

  it("spans several fragments when the text is split by marks", () => {
    const mapping: NodeTextMapping = {
      visibleText: VISIBLE_TEXT,
      baseOffset: PREFIX_LENGTH,
      fragments: [
        { absoluteFrom: 1, absoluteTo: 19, rawStart: 0, rawEnd: 18 },
        {
          absoluteFrom: 20,
          absoluteTo: 2 + VISIBLE_TEXT.length,
          rawStart: 18,
          rawEnd: VISIBLE_TEXT.length,
        },
      ],
    };

    const ranges = locateSegmentInNode(mapping, {
      start: 5,
      end: 22,
      selectedText: "criado o programa",
    });

    expect(ranges.length).toBeGreaterThan(1);
  });
});

describe("range conversion", () => {
  it("rawRangeToDocRanges offsets by the fragment position", () => {
    const mapping = makeMapping(0);

    expect(rawRangeToDocRanges(mapping, 0, 4)).toEqual([{ from: 1, to: 5 }]);
  });

  it("baseRangeToDocRanges adds the base offset", () => {
    const mapping = makeMapping(PREFIX_LENGTH);

    expect(sliceDoc(mapping, baseRangeToDocRanges(mapping, 0, 4))).toBe("Fica");
  });

  it("docPosToBaseOffset is the inverse of baseRangeToDocRanges", () => {
    const mapping = makeMapping(PREFIX_LENGTH);
    const [range] = baseRangeToDocRanges(mapping, 14, 22);

    expect(docPosToBaseOffset(mapping, range.from)).toBe(14);
  });

  it("docPosToBaseOffset returns null outside the node text", () => {
    expect(docPosToBaseOffset(makeMapping(0), 9999)).toBeNull();
  });
});
