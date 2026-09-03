import { describe, expect, it } from "vitest";
import { buildRetainedExcerpt } from "../text-utils";

/**
 * A veto message holds several provisions; quoting it means keeping the relevant
 * fragment and eliding the rest.
 */
const SOURCE_TEXT =
  "Ficam vetados os arts. 3º e 4º do projeto de lei aprovado.";

describe("buildRetainedExcerpt", () => {
  it("returns the whole text when nothing is marked", () => {
    expect(buildRetainedExcerpt(SOURCE_TEXT, [])).toBe(SOURCE_TEXT);
    expect(buildRetainedExcerpt(SOURCE_TEXT, undefined)).toBe(SOURCE_TEXT);
  });

  it("elides around a fragment in the middle", () => {
    const start = SOURCE_TEXT.indexOf("arts. 3º e 4º");
    const excerpt = buildRetainedExcerpt(SOURCE_TEXT, [
      { start, end: start + "arts. 3º e 4º".length },
    ]);

    expect(excerpt).toBe("[...] arts. 3º e 4º [...]");
  });

  it("does not add a leading ellipsis when the passage starts the text", () => {
    const excerpt = buildRetainedExcerpt(SOURCE_TEXT, [
      { start: 0, end: "Ficam vetados".length },
    ]);

    expect(excerpt).toBe("Ficam vetados [...]");
  });

  it("does not add a trailing ellipsis when the passage ends the text", () => {
    const start = SOURCE_TEXT.indexOf("do projeto de lei aprovado.");
    const excerpt = buildRetainedExcerpt(SOURCE_TEXT, [
      { start, end: SOURCE_TEXT.length },
    ]);

    expect(excerpt).toBe("[...] do projeto de lei aprovado.");
  });

  it("keeps several passages, eliding between them", () => {
    const first = SOURCE_TEXT.indexOf("vetados");
    const second = SOURCE_TEXT.indexOf("3º e 4º");

    const excerpt = buildRetainedExcerpt(SOURCE_TEXT, [
      { start: first, end: first + "vetados".length },
      { start: second, end: second + "3º e 4º".length },
    ]);

    expect(excerpt).toBe("[...] vetados [...] 3º e 4º [...]");
  });

  it("returns the full text when the passage covers everything", () => {
    expect(
      buildRetainedExcerpt(SOURCE_TEXT, [
        { start: 0, end: SOURCE_TEXT.length },
      ]),
    ).toBe(SOURCE_TEXT);
  });

  it("appends the note of a supplemented passage", () => {
    const start = SOURCE_TEXT.indexOf("arts. 3º e 4º");
    const excerpt = buildRetainedExcerpt(SOURCE_TEXT, [
      {
        start,
        end: start + "arts. 3º e 4º".length,
        type: "supplement",
        supplementText: "redação original",
      },
    ]);

    expect(excerpt).toBe("[...] arts. 3º e 4º [redação original] [...]");
  });

  it("accepts a custom ellipsis", () => {
    const start = SOURCE_TEXT.indexOf("arts.");
    const excerpt = buildRetainedExcerpt(
      SOURCE_TEXT,
      [{ start, end: start + 5 }],
      "(…)",
    );

    expect(excerpt).toBe("(…) arts. (…)");
  });

  it("ignores collapsed and out-of-range passages", () => {
    expect(buildRetainedExcerpt(SOURCE_TEXT, [{ start: 5, end: 5 }])).toBe(
      SOURCE_TEXT,
    );
    expect(
      buildRetainedExcerpt(SOURCE_TEXT, [{ start: 9999, end: 10000 }]),
    ).toBe(SOURCE_TEXT);
  });

  it("handles an empty base text", () => {
    expect(buildRetainedExcerpt("", [{ start: 0, end: 5 }])).toBe("");
  });

  it("is the inverse of an omission: what is marked is what remains", () => {
    const start = SOURCE_TEXT.indexOf("arts. 3º e 4º");
    const marked = { start, end: start + "arts. 3º e 4º".length };

    expect(buildRetainedExcerpt(SOURCE_TEXT, [marked])).toContain(
      "arts. 3º e 4º",
    );
  });
});
