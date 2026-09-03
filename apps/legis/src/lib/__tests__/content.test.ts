import { describe, expect, it } from "vitest";
import type { JSONContent } from "@tiptap/core";
import { getExcerpt, safeJSONParse } from "../content";

/**
 * Both helpers receive the raw string persisted for a normative element, which
 * may be a serialized Tiptap document or — for legacy records — plain
 * text/HTML. The tests below document how each shape is handled.
 */
const serialize = (doc: JSONContent): string => JSON.stringify(doc);

const paragraph = (...texts: string[]): JSONContent => ({
  type: "paragraph",
  content: texts.map((text) => ({ type: "text", text })),
});

const documentOf = (...blocks: JSONContent[]): JSONContent => ({
  type: "doc",
  content: blocks,
});

describe("safeJSONParse", () => {
  it("parses a serialized Tiptap document", () => {
    const doc = documentOf(
      paragraph("Art. 1º - Fica instituído o Plano Diretor."),
    );

    expect(safeJSONParse(serialize(doc))).toEqual(doc);
  });

  it("keeps the nesting of the document tree", () => {
    const doc = documentOf({
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [paragraph("I - da função social da cidade;")],
        },
      ],
    });

    const parsed = safeJSONParse(serialize(doc));

    expect(
      parsed?.content?.[0].content?.[0].content?.[0].content?.[0].text,
    ).toBe("I - da função social da cidade;");
  });

  it("parses a JSON array, since an array is also an object", () => {
    expect(
      safeJSONParse('[{"type":"paragraph"},{"type":"paragraph"}]'),
    ).toEqual([{ type: "paragraph" }, { type: "paragraph" }]);
  });

  it("rejects JSON primitives, which are never a document", () => {
    expect(safeJSONParse("1")).toBeUndefined();
    expect(safeJSONParse("true")).toBeUndefined();
    expect(safeJSONParse('"str"')).toBeUndefined();
    expect(safeJSONParse("null")).toBeUndefined();
  });

  it("rejects malformed JSON instead of throwing", () => {
    expect(safeJSONParse('{"type":"doc"')).toBeUndefined();
    expect(safeJSONParse("<p>Art. 1º</p>")).toBeUndefined();
  });

  it("rejects an empty or blank string", () => {
    expect(safeJSONParse("")).toBeUndefined();
    expect(safeJSONParse("   ")).toBeUndefined();
  });
});

describe("getExcerpt", () => {
  it("flattens the whole document tree into one line", () => {
    const doc = documentOf(paragraph("CAPÍTULO I"), {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [paragraph("I - da função social;")],
        },
      ],
    });

    expect(getExcerpt(serialize(doc))).toBe("CAPÍTULO I I - da função social;");
  });

  it("separates sibling text nodes with a single space and trims the result", () => {
    const doc = documentOf(paragraph("Fica", "instituído", "o", "Programa."));

    expect(getExcerpt(serialize(doc))).toBe("Fica instituído o Programa.");
  });

  it("collects the text of a node that also carries children", () => {
    const doc = documentOf({
      type: "paragraph",
      text: "pai",
      content: [{ type: "text", text: "filho" }],
    });

    expect(getExcerpt(serialize(doc))).toBe("pai filho");
  });

  it("keeps the whitespace inside a text node untouched", () => {
    const doc = documentOf(paragraph("Art.  1º   -  Fica"));

    expect(getExcerpt(serialize(doc))).toBe("Art.  1º   -  Fica");
  });

  it("truncates at 120 characters by default, appending an ellipsis", () => {
    const parts = [
      "Fica instituído o Programa Municipal de Arborização Urbana no âmbito do Município.",
      "A Secretaria de Meio Ambiente coordenará a sua execução.",
    ];
    const flat = parts.join(" ");
    expect(flat.length).toBeGreaterThan(120);

    const excerpt = getExcerpt(
      serialize(documentOf(...parts.map((text) => paragraph(text)))),
    );

    expect(excerpt).toBe(`${flat.slice(0, 120)}...`);
    expect(excerpt).toHaveLength(123);
  });

  it("does not append an ellipsis when the text is exactly at the limit", () => {
    const exact = "A".repeat(120);

    expect(getExcerpt(serialize(documentOf(paragraph(exact))))).toBe(exact);
  });

  it("appends an ellipsis as soon as the text passes the limit by one character", () => {
    const oneTooLong = "A".repeat(121);

    expect(getExcerpt(serialize(documentOf(paragraph(oneTooLong))))).toBe(
      `${"A".repeat(120)}...`,
    );
  });

  it("honours a custom maxLength", () => {
    const doc = serialize(documentOf(paragraph("Fica instituído o Programa.")));

    expect(getExcerpt(doc, 5)).toBe("Fica ...");
    expect(getExcerpt(doc, 27)).toBe("Fica instituído o Programa.");
    expect(getExcerpt(doc, 0)).toBe("...");
  });

  it("falls back to stripping HTML tags when the content is not JSON", () => {
    expect(
      getExcerpt("<p>Art. 1º - <strong>Fica</strong> instituído.</p>"),
    ).toBe("Art. 1º - Fica instituído.");
  });

  it("truncates the plain-text fallback with the same rule", () => {
    const html = `<p>${"B".repeat(130)}</p>`;

    expect(getExcerpt(html)).toBe(`${"B".repeat(120)}...`);
    expect(getExcerpt(html, 10)).toBe(`${"B".repeat(10)}...`);
  });

  it("returns an empty string for an empty input", () => {
    expect(getExcerpt("")).toBe("");
    expect(getExcerpt("   ")).toBe("");
  });

  it("returns an empty string for a document without text nodes", () => {
    expect(getExcerpt(serialize(documentOf({ type: "paragraph" })))).toBe("");
    expect(getExcerpt(serialize(documentOf({ type: "horizontalRule" })))).toBe(
      "",
    );
  });

  it("returns an empty string for the JSON literal null, which skips the traversal", () => {
    expect(getExcerpt("null")).toBe("");
  });

  it("returns an empty string for plain text that happens to be valid JSON", () => {
    // Documents current behaviour: "1988" parses as a number, so the JSON
    // branch wins and finds no text node instead of falling back.
    expect(getExcerpt("1988")).toBe("");
    expect(getExcerpt('"Ementa da lei"')).toBe("");
  });

  it('swallows plain text after a stray "<" in the fallback path', () => {
    // Documents current behaviour of the tag-stripping regex, which treats
    // everything after an unmatched "<" as a tag.
    expect(getExcerpt("Se x < 3, aplica-se o art. 2º")).toBe("Se x");
  });
});
