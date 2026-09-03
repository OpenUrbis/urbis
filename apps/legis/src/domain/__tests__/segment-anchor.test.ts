import { describe, expect, it } from "vitest";
import type { AnnotatedTextSegment, NormativeElement } from "../types";
import {
  adjustSegmentEdgeByWord,
  findSegmentOverlaps,
  getSegmentBaseText,
  isSegmentValid,
  locateTextInBase,
  mergeOverlappingSegments,
  resolveSegments,
  resolveSegmentsForRender,
  snapRangeToWordBoundaries,
  withSegmentAnchor,
} from "../segment-anchor";

function makeElement(
  overrides: Partial<NormativeElement> = {},
): NormativeElement {
  return {
    id: "el-1",
    type: "Artigo",
    index: "1º",
    text: "<p>Art. 1º - Fica criado o programa municipal de arborização urbana.</p>",
    originalStartValidity: { date: "", deviceId: "" },
    specialSituations: [],
    ...overrides,
  } as NormativeElement;
}

describe("getSegmentBaseText", () => {
  it("strips the normative prefix and the HTML wrapper", () => {
    expect(getSegmentBaseText(makeElement())).toBe(
      "Fica criado o programa municipal de arborização urbana.",
    );
  });

  it("produces a base that keeps the paragraph break", () => {
    const base = getSegmentBaseText(
      makeElement({
        text: "<p>Art. 2º - Primeiro parágrafo.</p><p>Segundo parágrafo.</p>",
        index: "2º",
      }),
    );

    // htmlToPlainText injects the newline; the base must contain it so that
    // offsets measured here match what the renderer slices.
    expect(base).toBe("Primeiro parágrafo.\nSegundo parágrafo.");
  });

  it("returns an empty string for missing text", () => {
    expect(getSegmentBaseText(null)).toBe("");
    expect(getSegmentBaseText(makeElement({ text: "" }))).toBe("");
  });
});

describe("locateTextInBase", () => {
  const base = "Fica criado o programa municipal de arborização urbana.";

  it("finds an exact occurrence", () => {
    const located = locateTextInBase(base, "programa municipal");
    expect(base.slice(located!.start, located!.end)).toBe("programa municipal");
  });

  it("tolerates whitespace differences between pipelines", () => {
    const located = locateTextInBase(base, "programa\n  municipal");
    expect(base.slice(located!.start, located!.end)).toBe("programa municipal");
  });

  it("uses the hint to disambiguate repeated wording", () => {
    const repeated = "o prazo é de 30 dias. O prazo é de 30 dias.";
    const first = locateTextInBase(repeated, "prazo", 0);
    const second = locateTextInBase(repeated, "prazo", 25);

    expect(first!.start).toBe(2);
    expect(second!.start).toBe(24);
  });

  it("returns null when the text is absent", () => {
    expect(locateTextInBase(base, "saneamento básico")).toBeNull();
  });
});

describe("resolveSegments", () => {
  const base = "Fica criado o programa municipal de arborização urbana.";

  it("reports exact matches without touching offsets", () => {
    const segment = withSegmentAnchor(base, {
      start: 14,
      end: 32,
      type: "omission",
    });
    const { segments, drifted } = resolveSegments(base, [segment]);

    expect(segments[0].status).toBe("exact");
    expect(segments[0].start).toBe(14);
    expect(drifted).toHaveLength(0);
  });

  it("re-anchors a segment after the text drifts", () => {
    const segment = withSegmentAnchor(base, {
      start: 14,
      end: 32,
      type: "omission",
    });
    const edited = `Nos termos do regulamento, ${base}`;

    const { segments, drifted } = resolveSegments(edited, [segment]);

    expect(segments[0].status).toBe("reanchored");
    expect(edited.slice(segments[0].start, segments[0].end)).toBe(
      "programa municipal",
    );
    expect(drifted).toHaveLength(1);
  });

  it("marks a segment as lost when its text disappeared", () => {
    const segment = withSegmentAnchor(base, {
      start: 14,
      end: 32,
      type: "omission",
    });
    const { segments, lost } = resolveSegments("Texto totalmente diferente.", [
      segment,
    ]);

    expect(segments[0].status).toBe("lost");
    expect(lost).toHaveLength(1);
  });

  it("keeps legacy segments without stored text as unverified", () => {
    const { segments } = resolveSegments(base, [{ start: 5, end: 11 }]);
    expect(segments[0].status).toBe("unverified");
    expect(segments[0].start).toBe(5);
  });

  it("drops lost segments when resolving for render", () => {
    const good = withSegmentAnchor(base, {
      start: 14,
      end: 32,
      type: "omission",
    });
    const bad: AnnotatedTextSegment = {
      start: 0,
      end: 10,
      type: "omission",
      selectedText: "inexistente aqui",
    };

    expect(resolveSegmentsForRender(base, [good, bad])).toHaveLength(1);
  });
});

describe("snapRangeToWordBoundaries", () => {
  const base = "Fica criado o programa municipal";

  it("expands a partial selection to whole words", () => {
    const snapped = snapRangeToWordBoundaries(base, 16, 26);
    expect(base.slice(snapped.start, snapped.end)).toBe("programa municipal");
  });

  it("keeps an already aligned range", () => {
    const snapped = snapRangeToWordBoundaries(base, 14, 22);
    expect(base.slice(snapped.start, snapped.end)).toBe("programa");
  });
});

describe("adjustSegmentEdgeByWord", () => {
  const base = "Fica criado o programa municipal de arborização";

  it("expands the start edge by one word", () => {
    const segment = withSegmentAnchor(base, {
      start: 14,
      end: 22,
      type: "omission",
    });
    const adjusted = adjustSegmentEdgeByWord(base, segment, "start", "expand");

    expect(base.slice(adjusted.start, adjusted.end)).toBe("o programa");
  });

  it("expands the end edge by one word", () => {
    const segment = withSegmentAnchor(base, {
      start: 14,
      end: 22,
      type: "omission",
    });
    const adjusted = adjustSegmentEdgeByWord(base, segment, "end", "expand");

    expect(base.slice(adjusted.start, adjusted.end)).toBe("programa municipal");
  });

  it("shrinks the end edge by one word", () => {
    const segment = withSegmentAnchor(base, {
      start: 14,
      end: 32,
      type: "omission",
    });
    const adjusted = adjustSegmentEdgeByWord(base, segment, "end", "shrink");

    expect(base.slice(adjusted.start, adjusted.end)).toBe("programa");
  });

  it("never collapses the segment", () => {
    const segment = withSegmentAnchor(base, {
      start: 14,
      end: 22,
      type: "omission",
    });
    const adjusted = adjustSegmentEdgeByWord(base, segment, "end", "shrink");

    expect(adjusted.end).toBeGreaterThan(adjusted.start);
  });

  it("keeps the stored text in sync after adjusting", () => {
    const segment = withSegmentAnchor(base, {
      start: 14,
      end: 22,
      type: "omission",
    });
    const adjusted = adjustSegmentEdgeByWord(base, segment, "end", "expand");

    expect(adjusted.selectedText).toBe("programa municipal");
  });
});

describe("overlap handling", () => {
  it("detects overlapping segments", () => {
    const overlaps = findSegmentOverlaps([
      { start: 0, end: 10 },
      { start: 5, end: 15 },
      { start: 20, end: 25 },
    ]);

    expect(overlaps).toEqual([{ firstIndex: 0, secondIndex: 1 }]);
  });

  it("merges overlapping segments of the same type", () => {
    const base = "Fica criado o programa municipal de arborização urbana.";
    const merged = mergeOverlappingSegments(base, [
      { start: 0, end: 12, type: "omission" },
      { start: 5, end: 22, type: "omission" },
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ start: 0, end: 22 });
  });

  it("keeps segments of different types apart", () => {
    const base = "Fica criado o programa municipal.";
    const merged = mergeOverlappingSegments(base, [
      { start: 0, end: 12, type: "omission" },
      { start: 5, end: 22, type: "supplement", supplementText: "nota" },
    ]);

    expect(merged).toHaveLength(2);
  });
});

describe("isSegmentValid", () => {
  it("rejects empty ranges", () => {
    expect(isSegmentValid({ start: 5, end: 5 })).toBe(false);
  });

  it("requires a note for supplements", () => {
    expect(isSegmentValid({ start: 0, end: 5, type: "supplement" })).toBe(
      false,
    );
    expect(
      isSegmentValid({
        start: 0,
        end: 5,
        type: "supplement",
        supplementText: "15,4m",
      }),
    ).toBe(true);
  });

  it("accepts a plain omission", () => {
    expect(isSegmentValid({ start: 0, end: 5, type: "omission" })).toBe(true);
  });
});
