import { describe, expect, it } from "vitest";
import {
  applyAnnotatedSegmentsToText,
  buildAnnotatedSegmentsExcerpt,
  buildCitationFromAnchoredSegments,
  buildRetainedExcerpt,
  extractTextFromWordIndices,
  getCleanDisplayText,
  getWordIndicesFromSelection,
  htmlToPlainText,
  normalizeAnnotatedTextSegments,
  normalizeOrdinals,
  parseToWordIndex,
  stripQuotes,
  stripRedundantLeadingKey,
} from "../text-utils";

/**
 * Complements `text-utils.spec.ts` (prefix cleanup) and
 * `__tests__/retained-excerpt.test.ts` (citation of kept passages) by covering
 * the exported helpers those files leave untouched, plus the edge cases they
 * skip. Every expectation documents the CURRENT behaviour of the module.
 */

/** 5 words: Fica[0,4) criado[5,11) o[12,13) programa[14,22) municipal.[23,33) */
const WORDS_TEXT = "Fica criado o programa municipal.";

/** Ficam[0,5) vetados[6,13) os[14,16) arts.[17,22) 3º[23,25) e[26,27) 4º[28,30) .[30] */
const VETO_TEXT = "Ficam vetados os arts. 3º e 4º.";

/** Fica[0,4) vetado[5,11) o[12,13) artigo.[14,21) */
const PLAIN_TEXT = "Fica vetado o artigo.";

const NOTE_SPAN = (note: string) =>
  ` <span class="italic text-muted-foreground">[${note}]</span>`;

describe("parseToWordIndex", () => {
  it("returns nothing for an empty text", () => {
    expect(parseToWordIndex("")).toEqual([]);
  });

  it("returns nothing for a whitespace-only text", () => {
    expect(parseToWordIndex("   \n\t ")).toEqual([]);
  });

  it("indexes each non-whitespace run with its character range", () => {
    expect(parseToWordIndex("Art. 1º - Fica")).toEqual([
      { word: "Art.", startIndex: 0, endIndex: 4, index: 0 },
      { word: "1º", startIndex: 5, endIndex: 7, index: 1 },
      { word: "-", startIndex: 8, endIndex: 9, index: 2 },
      { word: "Fica", startIndex: 10, endIndex: 14, index: 3 },
    ]);
  });

  it("treats newlines and tabs as delimiters and ignores repeated whitespace", () => {
    expect(
      parseToWordIndex("um\n\ndois\ttrês").map((entry) => entry.word),
    ).toEqual(["um", "dois", "três"]);
    expect(
      parseToWordIndex("  um   dois  ").map((entry) => entry.startIndex),
    ).toEqual([2, 7]);
  });

  it("counts accented characters as a single position", () => {
    expect(parseToWordIndex("Ação urbanística")).toEqual([
      { word: "Ação", startIndex: 0, endIndex: 4, index: 0 },
      { word: "urbanística", startIndex: 5, endIndex: 16, index: 1 },
    ]);
  });

  it("is repeatable: the internal regex keeps no state between calls", () => {
    expect(parseToWordIndex(WORDS_TEXT)).toEqual(parseToWordIndex(WORDS_TEXT));
  });
});

describe("getWordIndicesFromSelection", () => {
  it("maps an exact word range to that single word", () => {
    expect(getWordIndicesFromSelection(WORDS_TEXT, 0, 4)).toEqual({
      startWordIndex: 0,
      endWordIndex: 0,
    });
  });

  it("expands a partial selection to whole word boundaries", () => {
    expect(getWordIndicesFromSelection(WORDS_TEXT, 2, 8)).toEqual({
      startWordIndex: 0,
      endWordIndex: 1,
    });
  });

  it("resolves a collapsed caret to the word that encloses it", () => {
    expect(getWordIndicesFromSelection(WORDS_TEXT, 2, 2)).toEqual({
      startWordIndex: 0,
      endWordIndex: 0,
    });
  });

  it("resolves a caret sitting right after a word to that word", () => {
    expect(getWordIndicesFromSelection(WORDS_TEXT, 4, 4)).toEqual({
      startWordIndex: 0,
      endWordIndex: 0,
    });
  });

  it("spans every word touched by a long selection", () => {
    expect(getWordIndicesFromSelection(WORDS_TEXT, 5, 22)).toEqual({
      startWordIndex: 1,
      endWordIndex: 3,
    });
  });

  it("clamps a selection that runs past the end of the text", () => {
    expect(getWordIndicesFromSelection(WORDS_TEXT, 23, 999)).toEqual({
      startWordIndex: 4,
      endWordIndex: 4,
    });
  });

  it("tolerates a negative start offset", () => {
    expect(getWordIndicesFromSelection(WORDS_TEXT, -5, 4)).toEqual({
      startWordIndex: 0,
      endWordIndex: 0,
    });
  });

  it("returns null for an empty text", () => {
    expect(getWordIndicesFromSelection("", 0, 3)).toBeNull();
  });

  it("returns null when the range lies entirely outside the words", () => {
    expect(getWordIndicesFromSelection(WORDS_TEXT, 100, 200)).toBeNull();
    expect(getWordIndicesFromSelection("Fica   ", 5, 6)).toBeNull();
  });

  it("does not normalize a reversed range: it matches the enclosing words", () => {
    // Documents current behaviour — the "encloses" test is symmetric, so a
    // backwards range still resolves to the words around it.
    expect(getWordIndicesFromSelection(WORDS_TEXT, 8, 2)).toEqual({
      startWordIndex: 0,
      endWordIndex: 1,
    });
  });
});

describe("extractTextFromWordIndices", () => {
  it("elides on both sides for a range in the middle", () => {
    expect(extractTextFromWordIndices(WORDS_TEXT, 1, 2)).toBe(
      "[...] criado o [...]",
    );
  });

  it("omits the leading ellipsis when the range starts at the first word", () => {
    expect(extractTextFromWordIndices(WORDS_TEXT, 0, 1)).toBe(
      "Fica criado [...]",
    );
  });

  it("omits the trailing ellipsis when the range ends at the last word", () => {
    expect(extractTextFromWordIndices(WORDS_TEXT, 3, 4)).toBe(
      "[...] programa municipal.",
    );
  });

  it("returns the whole text without ellipses when every word is taken", () => {
    expect(extractTextFromWordIndices(WORDS_TEXT, 0, 4)).toBe(WORDS_TEXT);
  });

  it("clamps an end index past the last word", () => {
    expect(extractTextFromWordIndices(WORDS_TEXT, 0, 99)).toBe(WORDS_TEXT);
  });

  it("keeps the original spacing between the extracted words", () => {
    expect(extractTextFromWordIndices("um  dois  três", 0, 1)).toBe(
      "um  dois [...]",
    );
  });

  it("returns an empty string for an empty text", () => {
    expect(extractTextFromWordIndices("", 0, 1)).toBe("");
  });

  it("returns an empty string for out-of-range or inverted indices", () => {
    expect(extractTextFromWordIndices(WORDS_TEXT, -1, 2)).toBe("");
    expect(extractTextFromWordIndices(WORDS_TEXT, 5, 6)).toBe("");
    expect(extractTextFromWordIndices(WORDS_TEXT, 3, 1)).toBe("");
  });

  it("keeps the quotes of an ementa by default", () => {
    expect(extractTextFromWordIndices("“Dispõe sobre o solo.”", 0, 3)).toBe(
      "“Dispõe sobre o solo.”",
    );
  });

  it("strips one leading and one trailing quote when asked to", () => {
    expect(
      extractTextFromWordIndices("“Dispõe sobre o solo.”", 0, 3, true),
    ).toBe("Dispõe sobre o solo.");
    expect(
      extractTextFromWordIndices('"Dispõe sobre o solo."', 0, 3, true),
    ).toBe("Dispõe sobre o solo.");
  });

  it("strips only one quote per side, unlike stripQuotes", () => {
    expect(extractTextFromWordIndices("““Ementa””", 0, 0, true)).toBe(
      "“Ementa”",
    );
  });

  it("strips the quotes before adding the ellipses", () => {
    expect(
      extractTextFromWordIndices("“Dispõe sobre o solo.”", 0, 1, true),
    ).toBe("Dispõe sobre [...]");
  });
});

describe("normalizeOrdinals", () => {
  it("returns falsy input untouched", () => {
    expect(normalizeOrdinals("")).toBe("");
  });

  it('normalizes the masculine ordinal typed as a plain "o"', () => {
    expect(normalizeOrdinals("Art. 1o - Fica criado")).toBe(
      "Art. 1º - Fica criado",
    );
    expect(normalizeOrdinals("Art. 1o")).toBe("Art. 1º");
  });

  it("normalizes the degree sign and the other look-alikes", () => {
    expect(normalizeOrdinals("Arts. 1o 2° 3ᵒ.")).toBe("Arts. 1º 2º 3º.");
  });

  it("absorbs a dot and spaces between the number and the ordinal", () => {
    expect(normalizeOrdinals("Art. 10.º texto")).toBe("Art. 10º texto");
    expect(normalizeOrdinals("Art. 3 º texto")).toBe("Art. 3º texto");
  });

  it("keeps an already normalized ordinal", () => {
    expect(normalizeOrdinals("Art. 5º - texto")).toBe("Art. 5º - texto");
  });

  it('never touches an "o" that is not an ordinal', () => {
    expect(normalizeOrdinals("o saneamento do Município")).toBe(
      "o saneamento do Município",
    );
    expect(normalizeOrdinals("1ordem")).toBe("1ordem");
  });

  it("requires whitespace, a dot or the end of the string after the ordinal", () => {
    // Documents current behaviour: a comma right after the ordinal blocks it.
    expect(normalizeOrdinals("Arts. 1o, 2o e 3o")).toBe("Arts. 1o, 2º e 3º");
  });
});

describe("stripQuotes", () => {
  it("returns falsy input untouched", () => {
    expect(stripQuotes("")).toBe("");
  });

  it("trims the text and removes straight quotes from both ends", () => {
    expect(stripQuotes('  "Dispõe sobre o uso do solo."  ')).toBe(
      "Dispõe sobre o uso do solo.",
    );
  });

  it("removes several stacked quote characters", () => {
    expect(stripQuotes("«‘Ementa’»")).toBe("Ementa");
  });

  it("keeps quotes that are inside the text", () => {
    expect(stripQuotes('a lei "do solo" municipal')).toBe(
      'a lei "do solo" municipal',
    );
  });

  it("trims the whitespace left behind by a removed quote", () => {
    expect(stripQuotes('"  texto interno  "')).toBe("texto interno");
  });

  it("leaves the closing curly double quote in place", () => {
    // Documents current behaviour: U+201D (”) is missing from both character
    // classes, so only the opening quote is removed.
    expect(stripQuotes("“Ementa”")).toBe("Ementa”");
  });
});

describe("htmlToPlainText", () => {
  it("returns an empty string for empty input", () => {
    expect(htmlToPlainText("")).toBe("");
  });

  it("passes plain text through unchanged", () => {
    expect(htmlToPlainText("Fica criado o programa.")).toBe(
      "Fica criado o programa.",
    );
  });

  it("turns paragraph ends and line breaks into newlines", () => {
    expect(htmlToPlainText("<p>Primeiro</p><p>Segundo</p>")).toBe(
      "Primeiro\nSegundo\n",
    );
    expect(htmlToPlainText("Primeiro<br />Segundo")).toBe("Primeiro\nSegundo");
    expect(htmlToPlainText("<div>Primeiro</div>")).toBe("Primeiro\n");
  });

  it("marks list items with a bullet", () => {
    expect(htmlToPlainText("<ul><li>um</li><li>dois</li></ul>")).toBe(
      "• um\n• dois\n",
    );
  });

  it("collapses three or more newlines into a blank line", () => {
    expect(htmlToPlainText("<p>a</p><p></p><p></p><p>b</p>")).toBe("a\n\nb\n");
  });

  it("decodes entities only after the tags are stripped", () => {
    expect(htmlToPlainText("<p>Se x &lt; 3 e y &gt; 4</p>")).toBe(
      "Se x < 3 e y > 4\n",
    );
    expect(htmlToPlainText("Lei &amp; Decreto &quot;X&quot; &#39;Y&#39;")).toBe(
      "Lei & Decreto \"X\" 'Y'",
    );
  });

  it("replaces non-breaking spaces, both encoded and literal", () => {
    expect(htmlToPlainText("Art.&nbsp;1º")).toBe("Art. 1º");
    expect(htmlToPlainText("Art.\u00A01º")).toBe("Art. 1º");
  });

  it("is not idempotent for double-encoded entities", () => {
    // Why `applyAnnotatedSegmentsToText` takes a `preformatted` flag: running
    // the conversion twice decodes one level more and shifts every offset.
    expect(htmlToPlainText("Prazo:&amp;nbsp;30 dias")).toBe(
      "Prazo:&nbsp;30 dias",
    );
    expect(htmlToPlainText(htmlToPlainText("Prazo:&amp;nbsp;30 dias"))).toBe(
      "Prazo: 30 dias",
    );
  });
});

describe("normalizeAnnotatedTextSegments", () => {
  it("returns nothing when there is no segment", () => {
    expect(normalizeAnnotatedTextSegments()).toEqual([]);
    expect(normalizeAnnotatedTextSegments([])).toEqual([]);
  });

  it("defaults the type to omission and mirrors the text into the legacy field", () => {
    expect(
      normalizeAnnotatedTextSegments([
        { start: 0, end: 5, selectedText: "Ficam" },
      ]),
    ).toEqual([
      {
        start: 0,
        end: 5,
        type: "omission",
        selectedText: "Ficam",
        text: "Ficam",
      },
    ]);
  });

  it("reads the legacy text field as the selected text of an omission", () => {
    expect(
      normalizeAnnotatedTextSegments([{ start: 0, end: 5, text: "Ficam" }]),
    ).toEqual([
      {
        start: 0,
        end: 5,
        type: "omission",
        selectedText: "Ficam",
        text: "Ficam",
      },
    ]);
  });

  it("reads the legacy text field as the note of a supplement", () => {
    expect(
      normalizeAnnotatedTextSegments([
        { start: 0, end: 5, type: "supplement", text: "redação original" },
      ]),
    ).toEqual([
      {
        start: 0,
        end: 5,
        type: "supplement",
        supplementText: "redação original",
        text: "redação original",
      },
    ]);
  });

  it("keeps the selected text and the note side by side, trimmed", () => {
    expect(
      normalizeAnnotatedTextSegments([
        {
          start: 0,
          end: 5,
          selectedText: "  Ficam  ",
          supplementText: "  vetado  ",
        },
      ]),
    ).toEqual([
      {
        start: 0,
        end: 5,
        type: "omission",
        selectedText: "Ficam",
        supplementText: "vetado",
        text: "Ficam",
      },
    ]);
  });

  it("drops blank strings instead of keeping them", () => {
    expect(
      normalizeAnnotatedTextSegments([
        {
          start: 0,
          end: 5,
          selectedText: "   ",
          supplementText: "",
          omissionPlaceholder: "  ",
          anchorBefore: "",
        },
      ]),
    ).toEqual([{ start: 0, end: 5, type: "omission" }]);
  });

  it("trims the omission placeholder", () => {
    const [segment] = normalizeAnnotatedTextSegments([
      { start: 0, end: 5, omissionPlaceholder: "  (VETADO)  " },
    ]);

    expect(segment.omissionPlaceholder).toBe("(VETADO)");
  });

  it("keeps the relocation anchors verbatim, without trimming them", () => {
    const [segment] = normalizeAnnotatedTextSegments([
      {
        start: 0,
        end: 5,
        anchorBefore: " antes ",
        anchorAfter: " depois ",
      },
    ]);

    expect(segment.anchorBefore).toBe(" antes ");
    expect(segment.anchorAfter).toBe(" depois ");
  });

  it("floors fractional offsets and clamps a negative start to zero", () => {
    expect(normalizeAnnotatedTextSegments([{ start: -3, end: 4.9 }])).toEqual([
      { start: 0, end: 4, type: "omission" },
    ]);
    expect(normalizeAnnotatedTextSegments([{ start: 1.7, end: 5.2 }])).toEqual([
      { start: 1, end: 5, type: "omission" },
    ]);
  });

  it("drops zero-length segments", () => {
    expect(normalizeAnnotatedTextSegments([{ start: 5, end: 5 }])).toEqual([]);
    expect(normalizeAnnotatedTextSegments([{ start: 4.2, end: 4.8 }])).toEqual(
      [],
    );
  });

  it("drops inverted segments instead of swapping their bounds", () => {
    expect(normalizeAnnotatedTextSegments([{ start: 10, end: 4 }])).toEqual([]);
  });

  it("drops segments whose offsets are not finite numbers", () => {
    expect(
      normalizeAnnotatedTextSegments([
        { start: Number.NaN, end: 5 },
        { start: 0, end: Number.POSITIVE_INFINITY },
        { start: 0, end: 3 },
      ]),
    ).toEqual([{ start: 0, end: 3, type: "omission" }]);
  });

  it("keeps offsets that fall outside any text, since no text is given", () => {
    expect(
      normalizeAnnotatedTextSegments([{ start: 9999, end: 10050 }]),
    ).toEqual([{ start: 9999, end: 10050, type: "omission" }]);
  });

  it("sorts out-of-order segments by start and then by end", () => {
    expect(
      normalizeAnnotatedTextSegments([
        { start: 20, end: 25 },
        { start: 0, end: 9 },
        { start: 0, end: 4 },
      ]).map((segment) => [segment.start, segment.end]),
    ).toEqual([
      [0, 4],
      [0, 9],
      [20, 25],
    ]);
  });

  it("keeps overlapping segments apart instead of merging them", () => {
    expect(
      normalizeAnnotatedTextSegments([
        { start: 0, end: 10 },
        { start: 5, end: 15 },
      ]).map((segment) => [segment.start, segment.end]),
    ).toEqual([
      [0, 10],
      [5, 15],
    ]);
  });

  it("deduplicates identical segments", () => {
    expect(
      normalizeAnnotatedTextSegments([
        { start: 0, end: 5, selectedText: "Ficam" },
        { start: 0, end: 5, selectedText: "Ficam" },
      ]),
    ).toHaveLength(1);
  });

  it("keeps two segments over the same range when their type differs", () => {
    expect(
      normalizeAnnotatedTextSegments([
        { start: 0, end: 5, type: "omission" },
        { start: 0, end: 5, type: "supplement" },
      ]).map((segment) => segment.type),
    ).toEqual(["omission", "supplement"]);
  });

  it("collapses segments that differ only by their anchors, keeping the last one", () => {
    // The dedup key ignores `anchorBefore`/`anchorAfter`.
    const normalized = normalizeAnnotatedTextSegments([
      { start: 0, end: 5, selectedText: "Ficam", anchorBefore: "primeiro" },
      { start: 0, end: 5, selectedText: "Ficam", anchorBefore: "segundo" },
    ]);

    expect(normalized).toHaveLength(1);
    expect(normalized[0].anchorBefore).toBe("segundo");
  });

  it("ignores holes in the list", () => {
    expect(
      normalizeAnnotatedTextSegments([
        // @ts-expect-error the runtime guards against null entries coming from storage
        null,
        { start: 0, end: 3 },
      ]),
    ).toEqual([{ start: 0, end: 3, type: "omission" }]);
  });
});

describe("buildAnnotatedSegmentsExcerpt", () => {
  it("returns an empty string when there is no segment", () => {
    expect(buildAnnotatedSegmentsExcerpt()).toBe("");
    expect(buildAnnotatedSegmentsExcerpt([{ start: 5, end: 5 }])).toBe("");
  });

  it("uses the selected text of a single segment", () => {
    expect(
      buildAnnotatedSegmentsExcerpt([
        { start: 0, end: 5, selectedText: "Ficam vetados" },
      ]),
    ).toBe("Ficam vetados");
  });

  it("falls back to a label when the segment has no text", () => {
    expect(buildAnnotatedSegmentsExcerpt([{ start: 0, end: 5 }])).toBe(
      "Trecho selecionado",
    );
  });

  it("joins several segments with an ellipsis, in offset order", () => {
    expect(
      buildAnnotatedSegmentsExcerpt([
        { start: 23, end: 30, selectedText: "3º e 4º" },
        { start: 0, end: 5, selectedText: "Ficam" },
      ]),
    ).toBe("Ficam [...] 3º e 4º");
  });

  it("appends the note of a supplement in brackets", () => {
    expect(
      buildAnnotatedSegmentsExcerpt([
        {
          start: 0,
          end: 5,
          type: "supplement",
          selectedText: "Ficam",
          supplementText: "redação original",
        },
      ]),
    ).toBe("Ficam [redação original]");
  });

  it("takes the note of a supplement from the legacy text field", () => {
    expect(
      buildAnnotatedSegmentsExcerpt([
        { start: 0, end: 5, type: "supplement", text: "redação original" },
      ]),
    ).toBe("Trecho selecionado [redação original]");
  });

  it("ignores a note attached to an omission", () => {
    expect(
      buildAnnotatedSegmentsExcerpt([
        {
          start: 0,
          end: 5,
          selectedText: "Ficam",
          supplementText: "nota",
        },
      ]),
    ).toBe("Ficam");
  });
});

describe("buildRetainedExcerpt (edges)", () => {
  it("trims the base text, so the offsets refer to the trimmed version", () => {
    expect(
      buildRetainedExcerpt("   Ficam vetados.   ", [{ start: 0, end: 5 }]),
    ).toBe("Ficam [...]");
  });

  it("returns an empty string for a whitespace-only base text", () => {
    expect(buildRetainedExcerpt("   ", [{ start: 0, end: 2 }])).toBe("");
  });

  it("sorts the passages before assembling the citation", () => {
    expect(
      buildRetainedExcerpt(VETO_TEXT, [
        { start: 23, end: 30 },
        { start: 0, end: 5 },
      ]),
    ).toBe("Ficam [...] 3º e 4º [...]");
  });

  it("does not elide when only whitespace separates two passages", () => {
    expect(
      buildRetainedExcerpt(VETO_TEXT, [
        { start: 0, end: 5 },
        { start: 6, end: 13 },
      ]),
    ).toBe("Ficam vetados [...]");
  });

  it("drops a passage that covers only whitespace, keeping its ellipses", () => {
    expect(buildRetainedExcerpt(VETO_TEXT, [{ start: 5, end: 6 }])).toBe(
      "[...] [...]",
    );
  });

  it("repeats the shared text of two overlapping passages", () => {
    // Suspected bug, asserted as-is: the cursor is not used to clip the
    // second passage, so "vetados" shows up twice.
    expect(
      buildRetainedExcerpt(VETO_TEXT, [
        { start: 0, end: 13 },
        { start: 6, end: 22 },
      ]),
    ).toBe("Ficam vetados vetados os arts. [...]");
  });

  it("ignores the omission placeholder, which only applies to the inverse rendering", () => {
    expect(
      buildRetainedExcerpt(VETO_TEXT, [
        { start: 6, end: 13, omissionPlaceholder: "(VETADO)" },
      ]),
    ).toBe("[...] vetados [...]");
  });

  it("does not add empty brackets for a supplement without a note", () => {
    expect(
      buildRetainedExcerpt(VETO_TEXT, [
        { start: 6, end: 13, type: "supplement", supplementText: "   " },
      ]),
    ).toBe("[...] vetados [...]");
  });
});

describe("buildCitationFromAnchoredSegments", () => {
  it("returns undefined when there is no usable segment", () => {
    expect(buildCitationFromAnchoredSegments()).toBeUndefined();
    expect(buildCitationFromAnchoredSegments([])).toBeUndefined();
    expect(
      buildCitationFromAnchoredSegments([{ start: 5, end: 5 }]),
    ).toBeUndefined();
  });

  it("quotes a passage that starts the source text without any ellipsis", () => {
    expect(
      buildCitationFromAnchoredSegments([
        { start: 0, end: 5, selectedText: "Ficam vetados" },
      ]),
    ).toBe("Ficam vetados");
  });

  it("adds a leading ellipsis when the passage does not start the text", () => {
    expect(
      buildCitationFromAnchoredSegments([
        { start: 6, end: 13, selectedText: "vetados" },
      ]),
    ).toBe("[...] vetados");
  });

  it("adds a leading ellipsis when there is text anchored before the passage", () => {
    expect(
      buildCitationFromAnchoredSegments([
        { start: 0, end: 5, selectedText: "Ficam", anchorBefore: "preâmbulo" },
      ]),
    ).toBe("[...] Ficam");
  });

  it("adds a trailing ellipsis when there is text anchored after the passage", () => {
    expect(
      buildCitationFromAnchoredSegments([
        {
          start: 0,
          end: 5,
          selectedText: "Ficam",
          anchorAfter: "vetados os arts.",
        },
      ]),
    ).toBe("Ficam [...]");
  });

  it("ignores a whitespace-only anchor", () => {
    expect(
      buildCitationFromAnchoredSegments([
        {
          start: 0,
          end: 5,
          selectedText: "Ficam",
          anchorBefore: " ",
          anchorAfter: " ",
        },
      ]),
    ).toBe("Ficam");
  });

  it("elides between the passages and looks only at the outer anchors", () => {
    expect(
      buildCitationFromAnchoredSegments([
        { start: 0, end: 5, selectedText: "Ficam", anchorAfter: "os arts." },
        { start: 23, end: 30, selectedText: "3º e 4º" },
      ]),
    ).toBe("Ficam [...] 3º e 4º");
  });

  it("appends the note of a supplement", () => {
    expect(
      buildCitationFromAnchoredSegments([
        {
          start: 0,
          end: 5,
          type: "supplement",
          selectedText: "Ficam",
          supplementText: "redação original",
        },
      ]),
    ).toBe("Ficam [redação original]");
  });

  it("skips a segment that carries no text of its own", () => {
    expect(
      buildCitationFromAnchoredSegments([
        { start: 0, end: 5, selectedText: "Ficam" },
        { start: 23, end: 30 },
      ]),
    ).toBe("Ficam [...]");
  });

  it("returns undefined when nothing but an ellipsis would be left", () => {
    expect(
      buildCitationFromAnchoredSegments([{ start: 6, end: 13 }]),
    ).toBeUndefined();
  });

  it("accepts a custom ellipsis, including for the empty-citation check", () => {
    expect(
      buildCitationFromAnchoredSegments(
        [{ start: 6, end: 13, selectedText: "vetados" }],
        "(…)",
      ),
    ).toBe("(…) vetados");
    expect(
      buildCitationFromAnchoredSegments([{ start: 6, end: 13 }], "(…)"),
    ).toBeUndefined();
  });
});

describe("applyAnnotatedSegmentsToText", () => {
  it("returns the text untouched when there is no segment", () => {
    expect(applyAnnotatedSegmentsToText("<p>Fica vetado.</p>")).toBe(
      "<p>Fica vetado.</p>",
    );
    expect(applyAnnotatedSegmentsToText("<p>Fica vetado.</p>", [])).toBe(
      "<p>Fica vetado.</p>",
    );
  });

  it("returns the text untouched when every segment is dropped by normalization", () => {
    expect(
      applyAnnotatedSegmentsToText("<p>Fica vetado.</p>", [
        { start: 3, end: 3 },
      ]),
    ).toBe("<p>Fica vetado.</p>");
  });

  it("replaces an omitted passage with an ellipsis", () => {
    expect(
      applyAnnotatedSegmentsToText(PLAIN_TEXT, [{ start: 5, end: 11 }], {
        preformatted: true,
      }),
    ).toBe("Fica [...] o artigo.");
  });

  it("adds the spaces the placeholder needs when it would glue to its neighbours", () => {
    expect(
      applyAnnotatedSegmentsToText("abcdef", [{ start: 2, end: 4 }], {
        preformatted: true,
      }),
    ).toBe("ab [...] ef");
  });

  it("does not pad the placeholder at the boundaries of the text", () => {
    expect(
      applyAnnotatedSegmentsToText("abcdef", [{ start: 0, end: 2 }], {
        preformatted: true,
      }),
    ).toBe("[...] cdef");
    expect(
      applyAnnotatedSegmentsToText("abcdef", [{ start: 4, end: 6 }], {
        preformatted: true,
      }),
    ).toBe("abcd [...]");
  });

  it("honours a custom placeholder and escapes it", () => {
    expect(
      applyAnnotatedSegmentsToText(
        PLAIN_TEXT,
        [{ start: 5, end: 11, omissionPlaceholder: "  (VETADO)  " }],
        { preformatted: true },
      ),
    ).toBe("Fica (VETADO) o artigo.");
    expect(
      applyAnnotatedSegmentsToText(
        PLAIN_TEXT,
        [{ start: 5, end: 11, omissionPlaceholder: "<VETADO>" }],
        { preformatted: true },
      ),
    ).toBe("Fica &lt;VETADO&gt; o artigo.");
  });

  it("keeps the text of a supplement and appends its note", () => {
    expect(
      applyAnnotatedSegmentsToText(
        PLAIN_TEXT,
        [
          {
            start: 5,
            end: 11,
            type: "supplement",
            supplementText: "redação original",
          },
        ],
        { preformatted: true },
      ),
    ).toBe(`Fica vetado${NOTE_SPAN("redação original")} o artigo.`);
  });

  it("keeps a supplement without a note as plain text", () => {
    expect(
      applyAnnotatedSegmentsToText(
        PLAIN_TEXT,
        [{ start: 5, end: 11, type: "supplement" }],
        { preformatted: true },
      ),
    ).toBe(PLAIN_TEXT);
  });

  it("annotates an omission that also carries a note", () => {
    expect(
      applyAnnotatedSegmentsToText(
        PLAIN_TEXT,
        [{ start: 5, end: 11, supplementText: "Lei & Decreto" }],
        { preformatted: true },
      ),
    ).toBe(`Fica [...]${NOTE_SPAN("Lei &amp; Decreto")} o artigo.`);
  });

  it("escapes the kept text and turns its newlines into line breaks", () => {
    expect(
      applyAnnotatedSegmentsToText("x < 3\ny > 4", [{ start: 0, end: 1 }], {
        preformatted: true,
      }),
    ).toBe("[...] &lt; 3<br />y &gt; 4");
  });

  it("converts HTML to plain text first, so the offsets refer to the plain text", () => {
    expect(
      applyAnnotatedSegmentsToText("<p>Fica vetado o artigo.</p>", [
        { start: 5, end: 11 },
      ]),
    ).toBe("Fica [...] o artigo.<br />");
  });

  it("escapes the markup instead of interpreting it when the text is preformatted", () => {
    expect(
      applyAnnotatedSegmentsToText("<p>abc</p>", [{ start: 0, end: 3 }], {
        preformatted: true,
      }),
    ).toBe("[...] abc&lt;/p&gt;");
  });

  it("returns an empty string when the text has nothing left after the conversion", () => {
    expect(applyAnnotatedSegmentsToText("", [{ start: 0, end: 5 }])).toBe("");
    expect(
      applyAnnotatedSegmentsToText("<p></p>", [{ start: 0, end: 5 }]),
    ).toBe("");
  });

  it("applies several omissions in a row", () => {
    expect(
      applyAnnotatedSegmentsToText(
        VETO_TEXT,
        [
          { start: 0, end: 5 },
          { start: 14, end: 22 },
        ],
        { preformatted: true },
      ),
    ).toBe("[...] vetados [...] 3º e 4º.");
  });

  it("clips an overlapping segment to the end of the previous one", () => {
    // Two spaces: the first placeholder is padded on the right and the second
    // on the left. No text is ever duplicated, though.
    expect(
      applyAnnotatedSegmentsToText(
        "abcdefghij",
        [
          { start: 0, end: 4 },
          { start: 2, end: 6 },
        ],
        { preformatted: true },
      ),
    ).toBe("[...]  [...] ghij");
  });

  it("drops a segment already contained in the previous one", () => {
    expect(
      applyAnnotatedSegmentsToText(
        "abcdefghij",
        [
          { start: 0, end: 6 },
          { start: 2, end: 4 },
        ],
        { preformatted: true },
      ),
    ).toBe("[...] ghij");
  });

  it("ignores a segment that starts past the end of the text", () => {
    expect(
      applyAnnotatedSegmentsToText(PLAIN_TEXT, [{ start: 999, end: 1000 }], {
        preformatted: true,
      }),
    ).toBe(PLAIN_TEXT);
  });

  it("clamps a segment that runs past the end of the text", () => {
    expect(
      applyAnnotatedSegmentsToText(PLAIN_TEXT, [{ start: 14, end: 999 }], {
        preformatted: true,
      }),
    ).toBe("Fica vetado o [...]");
  });

  it("swallows the space of an omission that covers only whitespace", () => {
    // Suspected bug, asserted as-is: nothing replaces the omitted run, and
    // the words around it end up glued together.
    expect(
      applyAnnotatedSegmentsToText(PLAIN_TEXT, [{ start: 4, end: 5 }], {
        preformatted: true,
      }),
    ).toBe("Ficavetado o artigo.");
  });

  it("preserves accented Portuguese text around the placeholder", () => {
    const text = "A concessão da licença observará as diretrizes de ocupação.";
    const start = text.indexOf("da licença");

    expect(
      applyAnnotatedSegmentsToText(
        text,
        [{ start, end: start + "da licença".length }],
        { preformatted: true },
      ),
    ).toBe("A concessão [...] observará as diretrizes de ocupação.");
  });
});

describe("stripRedundantLeadingKey (edges)", () => {
  it("returns the raw text when there is no key to strip", () => {
    expect(stripRedundantLeadingKey("I - texto")).toBe("I - texto");
    expect(stripRedundantLeadingKey("I - texto", "")).toBe("I - texto");
    expect(stripRedundantLeadingKey("I - texto", "   ")).toBe("I - texto");
  });

  it("returns the raw text when there is nothing to strip it from", () => {
    expect(stripRedundantLeadingKey("", "I - ")).toBe("");
  });

  it("strips the key from a plain text", () => {
    expect(
      stripRedundantLeadingKey("I - socialização dos ganhos;", "I - "),
    ).toBe("socialização dos ganhos;");
  });

  it("drops the closing tags an earlier cleanup left at the front", () => {
    expect(stripRedundantLeadingKey("</strong> I - texto", "I - ")).toBe(
      "texto",
    );
  });

  it("crosses the tags that split the key", () => {
    expect(
      stripRedundantLeadingKey("<strong>§ 1º</strong> - texto", "§ 1º - "),
    ).toBe("texto");
  });

  it("crosses encoded and literal non-breaking spaces", () => {
    expect(stripRedundantLeadingKey("a)&nbsp;texto", "a) ")).toBe("texto");
    expect(stripRedundantLeadingKey("a)\u00A0texto", "a) ")).toBe("texto");
  });

  it("matches the key regardless of case", () => {
    expect(stripRedundantLeadingKey("I - texto", "i - ")).toBe("texto");
  });

  it("strips the key only once", () => {
    expect(stripRedundantLeadingKey("I - I - texto", "I - ")).toBe("I - texto");
  });

  it("keeps a text that does not start with the key, only trimming it", () => {
    expect(stripRedundantLeadingKey("  texto sem chave  ", "I - ")).toBe(
      "texto sem chave",
    );
  });
});

describe("getCleanDisplayText (edges)", () => {
  it("returns an empty string for an empty text", () => {
    expect(getCleanDisplayText("", "Artigo", "1")).toBe("");
  });

  it("unwraps a single surrounding paragraph", () => {
    expect(getCleanDisplayText("<p>Texto livre</p>", "Artigo")).toBe(
      "Texto livre",
    );
  });

  it("keeps the markup when there is more than one paragraph", () => {
    expect(getCleanDisplayText("<p>um</p><p>dois</p>", "Artigo")).toBe(
      "<p>um</p><p>dois</p>",
    );
  });

  it("only trims when no index is given", () => {
    expect(getCleanDisplayText("  Art. 1º - Fica criado  ", "Artigo")).toBe(
      "Art. 1º - Fica criado",
    );
  });

  it('removes the prefix of a "parágrafo único"', () => {
    expect(
      getCleanDisplayText(
        "Parágrafo único - Aplica-se o disposto.",
        "Parágrafo",
        "único",
      ),
    ).toBe("Aplica-se o disposto.");
    expect(
      getCleanDisplayText(
        "PARAGRAFO UNICO. Aplica-se o disposto.",
        "Parágrafo",
        "único",
      ),
    ).toBe("Aplica-se o disposto.");
  });

  it("removes a numbered paragraph sign", () => {
    expect(
      getCleanDisplayText(
        "§ 1º - O disposto neste artigo...",
        "Parágrafo",
        "1º",
      ),
    ).toBe("O disposto neste artigo...");
    expect(
      getCleanDisplayText(
        "§2. Aplica-se o disposto neste artigo.",
        "Parágrafo",
        "2",
      ),
    ).toBe("Aplica-se o disposto neste artigo.");
  });

  it('swallows a standalone "O" that follows the index', () => {
    // Suspected bug, asserted as-is: the whole pattern is case-insensitive, so
    // the "duplicated ordinal" cleanup (meant for a stray "o" artifact) also
    // matches the Portuguese article "O" and the uppercase lookahead matches
    // any letter.
    expect(
      getCleanDisplayText("§2. O disposto neste artigo...", "Parágrafo", "2"),
    ).toBe("disposto neste artigo...");
    expect(
      getCleanDisplayText("Art. 2. O Município promoverá...", "Artigo", "2"),
    ).toBe("Município promoverá...");
  });

  it('accepts the ordinal typed as a plain "o" in the article prefix', () => {
    expect(
      getCleanDisplayText("Art. 1o Fica criado o programa.", "Artigo", "1º"),
    ).toBe("Fica criado o programa.");
  });

  it('spells out the article prefix as "Artigo"', () => {
    expect(
      getCleanDisplayText("Artigo 2º Esta lei entra em vigor.", "Artigo", "2º"),
    ).toBe("Esta lei entra em vigor.");
  });

  it("removes a prefix repeated twice, as the cleanup runs two passes", () => {
    expect(
      getCleanDisplayText("Art. 36 Art. 36. Fica alterado.", "Artigo", "36"),
    ).toBe("Fica alterado.");
  });

  it("crosses a leading non-breaking space", () => {
    expect(
      getCleanDisplayText("\u00A0Art. 5º - Fica revogado.", "Artigo", "5º"),
    ).toBe("Fica revogado.");
  });

  it("removes the headings of the structural types", () => {
    expect(
      getCleanDisplayText("CAPÍTULO II - DAS DIRETRIZES", "Capítulo", "II"),
    ).toBe("DAS DIRETRIZES");
    expect(getCleanDisplayText("Seção I – Do Objeto", "Seção", "I")).toBe(
      "Do Objeto",
    );
    expect(
      getCleanDisplayText("SUBSEÇÃO I - Da Fiscalização", "Subseção", "I"),
    ).toBe("Da Fiscalização");
    expect(getCleanDisplayText("TÍTULO I DAS DISPOSIÇÕES", "Título", "I")).toBe(
      "DAS DISPOSIÇÕES",
    );
    expect(getCleanDisplayText("LIVRO II - DO DIREITO", "Livro", "II")).toBe(
      "DO DIREITO",
    );
    expect(getCleanDisplayText("PARTE I - Geral", "Parte", "I")).toBe("Geral");
  });

  it("removes the parenthesized index of a note", () => {
    expect(
      getCleanDisplayText("(1) Redação dada pela Lei nº 2.", "Nota", "1"),
    ).toBe("Redação dada pela Lei nº 2.");
  });

  it("still trims leading dashes and dots for an unknown type", () => {
    expect(getCleanDisplayText("- texto solto", "Ementa", "1")).toBe(
      "texto solto",
    );
  });

  it("keeps the text when the prefix does not match the index", () => {
    expect(getCleanDisplayText("Art. 9º - Fica criado", "Artigo", "10")).toBe(
      "Art. 9º - Fica criado",
    );
  });

  it("does not eat the content when it repeats the index of a list item", () => {
    expect(
      getCleanDisplayText("I - Instituir o conselho;", "Inciso", "I"),
    ).toBe("Instituir o conselho;");
  });
});
