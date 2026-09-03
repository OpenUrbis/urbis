import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HighlightedText, extractMatchedTerms } from "../search-highlight";

describe("extractMatchedTerms", () => {
  it("collects the terms the backend marked in each snippet", () => {
    const terms = extractMatchedTerms([
      { snippet: "…verificações e <mark>testes</mark> periódicos…" },
      { snippet: "Lei de <mark>testes</mark> para visualização" },
      { snippet: "<mark>Código</mark> de Obras" },
    ]);

    expect(terms).toEqual(["testes", "Código"]);
  });

  it("decodes the entities used when the snippet is escaped", () => {
    expect(
      extractMatchedTerms([
        { snippet: "a <mark>obras &amp; edifica&#39;s</mark> b" },
      ]),
    ).toEqual(["obras & edifica's"]);
  });

  it("returns nothing when there is no marked passage", () => {
    expect(extractMatchedTerms([{ snippet: "sem marcação" }])).toEqual([]);
  });
});

describe("HighlightedText", () => {
  it("marks every occurrence regardless of casing, preserving the original text", () => {
    const html = renderToStaticMarkup(
      <HighlightedText
        text="Teste de tabelas e teste de figuras"
        terms={["teste"]}
      />,
    );

    expect(html).toContain("<mark class");
    expect(html).toContain(">Teste</mark>");
    expect(html).toContain(">teste</mark>");
  });

  it("renders plain text when there are no terms", () => {
    const html = renderToStaticMarkup(
      <HighlightedText text="Código de Obras" terms={[]} />,
    );

    expect(html).toBe("Código de Obras");
  });

  it("treats regex metacharacters in the term as literals", () => {
    const html = renderToStaticMarkup(
      <HighlightedText text="Art. 1º (revogado)" terms={["1º (revogado)"]} />,
    );

    expect(html).toContain(">1º (revogado)</mark>");
  });
});
