import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ElementContent, NormativeDocumentRenderer } from "../NormativeDocumentRenderer";
import { getSegmentBaseText } from "../../../domain/segment-anchor";
import { htmlToPlainText } from "../../../domain/text-utils";
import { OriginalNormativo } from "../../../domain/entities";

const PARTIAL_SEGMENT_PLACEHOLDER_CASES = [
  { type: "Veto", placeholder: "(VETADO)" },
  { type: "Revogação", placeholder: "(REVOGADO)" },
  { type: "Anulação", placeholder: "(ANULADO)" },
  { type: "Cassação", placeholder: "(CASSADO)" },
  {
    type: "Perda definitiva de vigor/eficácia",
    placeholder: "(SEM VIGOR/EFICÁCIA)",
  },
  { type: "Suspensão de vigor/eficácia", placeholder: "(SUSPENSO)" },
] as const;

describe("ElementContent", () => {
  it("should add ordinal formatting for single-digit article indexes during visualization", () => {
    const html = renderToStaticMarkup(
      <ElementContent
        element={
          {
            id: "art-7",
            type: "Artigo",
            index: "7",
            text: "Art. 7º o Pode ser declarada a morte presumida, sem decretação de ausência:",
            specialSituations: [],
          } as any
        }
        noteMap={new Map()}
      />,
    );

    expect(html).toContain("Art. 7º ");
    expect(html).toContain(
      "Pode ser declarada a morte presumida, sem decretação de ausência:",
    );
    expect(html).not.toContain(
      "Art. 7º o Pode ser declarada a morte presumida, sem decretação de ausência:",
    );
  });

  it("should normalize article visualization when the source text contains a trailing dot after the number", () => {
    const html = renderToStaticMarkup(
      <ElementContent
        element={
          {
            id: "art-31",
            type: "Artigo",
            index: "31",
            text: "Art. 31. Os imóveis do ausente só se poderão alienar.",
            specialSituations: [],
          } as any
        }
        noteMap={new Map()}
      />,
    );

    expect(html).toContain("Art. 31 ");
    expect(html).toContain("Os imóveis do ausente só se poderão alienar.");
    expect(html).not.toContain(
      "Art. 31. Os imóveis do ausente só se poderão alienar.",
    );
  });

  it("should normalize article visualization when the source text uses thousand separators", () => {
    const html = renderToStaticMarkup(
      <ElementContent
        element={
          {
            id: "art-1000",
            type: "Artigo",
            index: "1000",
            text: "Art. 1.000. A sociedade simples que instituir sucursal.",
            specialSituations: [],
          } as any
        }
        noteMap={new Map()}
      />,
    );

    expect(html).toContain("Art. 1000 ");
    expect(html).toContain("A sociedade simples que instituir sucursal.");
    expect(html).not.toContain(
      "Art. 1.000. A sociedade simples que instituir sucursal.",
    );
  });

  it("should keep articles above nine without ordinal formatting", () => {
    const html = renderToStaticMarkup(
      <ElementContent
        element={
          {
            id: "art-43",
            type: "Artigo",
            index: "43",
            text: "Art. 43 As pessoas jurídicas de direito público interno são civilmente responsáveis.",
            specialSituations: [],
          } as any
        }
        noteMap={new Map()}
      />,
    );

    expect(html).toContain("Art. 43 ");
    expect(html).not.toContain("Art. 43º ");
  });

  it("should remove document line-through for segmented partial situations while preserving scenario-specific placeholders", () => {
    PARTIAL_SEGMENT_PLACEHOLDER_CASES.forEach(({ type, placeholder }) => {
      const html = renderToStaticMarkup(
        <ElementContent
          element={
            {
              id: `art-partial-${type}`,
              type: "Artigo",
              index: "5",
              text: "Art. 5 Procedimentos e regras aplicáveis.",
              specialSituations: [
                {
                  type,
                  date: "01.01.2021",
                  trechos: [
                    {
                      start: 0,
                      end: 13,
                      type: "omission",
                      selectedText: "Procedimentos",
                    },
                  ],
                },
              ],
            } as any
          }
          noteMap={new Map()}
          suppressPartialLineThroughOnSegmentedSituations
        />,
      );

      expect(html).toContain(placeholder);
      expect(html).not.toContain("text-decoration:line-through");
    });
  });

  it("should replace the element text with (VETADO) by default when no specific trechos are selected", () => {
    const html = renderToStaticMarkup(
      <ElementContent
        element={
          {
            id: "art-veto-no-trechos",
            type: "Artigo",
            index: "6",
            text: "Art. 6 Procedimentos e regras aplicáveis.",
            specialSituations: [
              {
                type: "Veto",
                date: "01.01.2021",
              },
            ],
          } as any
        }
        noteMap={new Map()}
      />,
    );

    expect(html).toContain("(VETADO)");
    expect(html).not.toContain("Procedimentos e regras aplicáveis.");
  });

  it("should display previous text strikethrough and newText in dark blue when a Nova redação situation is present", () => {
    const html = renderToStaticMarkup(
      <ElementContent
        element={
          {
            id: "art-nova-redacao",
            type: "Artigo",
            index: "1º",
            text: "Art. 1º Texto original antigo do artigo.",
            specialSituations: [
              {
                type: "Nova redação",
                date: "01.01.2024",
                newText: "Texto novo do artigo aprovado.",
              },
            ],
          } as any
        }
        noteMap={new Map()}
      />,
    );

    expect(html).toContain("Texto novo do artigo aprovado.");
    expect(html).toContain("Texto original antigo do artigo.");
    expect(html).toContain("line-through");
    expect(html).toContain("text-blue-950");
  });

  it("should keep line-through by default for veto outside the document visualization override", () => {
    const html = renderToStaticMarkup(
      <ElementContent
        element={
          {
            id: "art-veto-default",
            type: "Artigo",
            index: "6",
            text: "Art. 6 Procedimentos e regras aplicáveis.",
            specialSituations: [
              {
                type: "Veto",
                date: "01.01.2021",
                trechos: [
                  {
                    start: 0,
                    end: 13,
                    type: "omission",
                    selectedText: "Procedimentos",
                  },
                ],
              },
            ],
          } as any
        }
        noteMap={new Map()}
      />,
    );

    expect(html).toContain("(VETADO)");
    expect(html).toContain("text-decoration:line-through");
  });

  it("should append altered initial validity summary and future suspension status", () => {
    const html = renderToStaticMarkup(
      <ElementContent
        element={
          {
            id: "art-validity-start",
            type: "Artigo",
            index: "9",
            text: "Art. 9 Produz efeitos após a data prevista.",
            originalStartValidity: { date: "01.01.2020", deviceId: "" },
            specialSituations: [
              {
                type: "Vigência inicial alterada",
                date: "01.01.2099",
                dispositivo: "Art. 10",
              },
            ],
          } as any
        }
        noteMap={new Map()}
      />,
    );

    expect(html).toContain(
      "[Vigência: a partir de 01.01.2099 · suspensa por vigência inicial]",
    );
  });

  it("should append altered final validity summary and ended suspension status", () => {
    const html = renderToStaticMarkup(
      <ElementContent
        element={
          {
            id: "art-validity-end",
            type: "Artigo",
            index: "10",
            text: "Art. 10 Produz efeitos temporários.",
            originalStartValidity: { date: "01.01.2020", deviceId: "" },
            originalEndValidity: { date: "01.01.2099", deviceId: "" },
            specialSituations: [
              {
                type: "Vigência final alterada",
                date: "01.01.2000",
                dispositivo: "Art. 20",
              },
            ],
          } as any
        }
        noteMap={new Map()}
      />,
    );

    expect(html).toContain(
      "[Vigência: de 01.01.2020 até 01.01.2000 · suspensa por vigência final]",
    );
  });
});

describe("ElementContent segment anchoring", () => {
  const ARTICLE = {
    id: "art-anchor",
    type: "Artigo",
    index: "1º",
    text: "<p>Art. 1º - Fica criado o programa municipal de arborização urbana.</p>",
    specialSituations: [],
  };

  const MULTI_PARAGRAPH_ARTICLE = {
    id: "art-multi",
    type: "Artigo",
    index: "2º",
    text: "<p>Art. 2º - Primeiro parágrafo do artigo.</p><p>Segundo parágrafo do artigo.</p>",
    specialSituations: [],
  };

  function render(element: unknown) {
    return renderToStaticMarkup(
      <ElementContent element={element as any} noteMap={new Map()} />,
    );
  }

  function segmentFor(
    element: unknown,
    selectedText: string,
    extra: Record<string, unknown> = {},
  ) {
    const base = getSegmentBaseText(element as any);
    const start = base.indexOf(selectedText);

    return {
      start,
      end: start + selectedText.length,
      type: "omission",
      selectedText,
      ...extra,
    };
  }

  it("keeps the canonical base stable through the conversion applied by applyAnnotatedSegmentsToText", () => {
    [
      ARTICLE,
      MULTI_PARAGRAPH_ARTICLE,
      {
        id: "art-list",
        type: "Artigo",
        index: "3º",
        text: "<p>Art. 3º - Ficam vedados:</p><ul><li>o corte raso;</li><li>a queima.</li></ul>",
        specialSituations: [],
      },
    ].forEach((element) => {
      const base = getSegmentBaseText(element as any);
      expect(htmlToPlainText(base)).toBe(base);
    });
  });

  it("omits a passage marked in the middle of the text", () => {
    const html = render({
      ...ARTICLE,
      segments: [segmentFor(ARTICLE, "programa municipal")],
    });

    expect(html).toContain("Fica criado o [...] de arborização urbana.");
  });

  it("omits a passage marked in the second paragraph of a multi-paragraph element", () => {
    const html = render({
      ...MULTI_PARAGRAPH_ARTICLE,
      segments: [segmentFor(MULTI_PARAGRAPH_ARTICLE, "Segundo parágrafo")],
    });

    expect(html).toContain(
      "Primeiro parágrafo do artigo.<br />[...] do artigo.",
    );
  });

  it("renders a supplemented passage with its note in brackets", () => {
    const html = render({
      ...ARTICLE,
      segments: [
        segmentFor(ARTICLE, "arborização urbana", {
          type: "supplement",
          supplementText: "redação dada pela Lei nº 10",
        }),
      ],
    });

    expect(html).toContain("arborização urbana");
    expect(html).toContain("[redação dada pela Lei nº 10]");
    expect(html).not.toContain("[...]");
  });

  it("re-anchors segments whose offsets were persisted against another base", () => {
    const staleOffset = ARTICLE.text.indexOf("programa municipal");
    const html = render({
      ...ARTICLE,
      segments: [
        {
          start: staleOffset,
          end: staleOffset + "programa municipal".length,
          type: "omission",
          selectedText: "programa municipal",
        },
      ],
    });

    expect(html).toContain("Fica criado o [...] de arborização urbana.");
    expect(html).not.toContain("municipal de");
  });

  it("re-anchors situation trechos and keeps the situation placeholder", () => {
    const staleOffset = ARTICLE.text.indexOf("programa municipal");
    const html = renderToStaticMarkup(
      <ElementContent
        element={
          {
            ...ARTICLE,
            specialSituations: [
              {
                type: "Veto",
                date: "01.01.2021",
                trechos: [
                  {
                    start: staleOffset,
                    end: staleOffset + "programa municipal".length,
                    type: "omission",
                    selectedText: "programa municipal",
                  },
                ],
              },
            ],
          } as any
        }
        noteMap={new Map()}
        suppressPartialLineThroughOnSegmentedSituations
      />,
    );

    expect(html).toContain("Fica criado o (VETADO) de arborização urbana.");
    expect(html).not.toContain("text-decoration:line-through");
  });

  it("falls back to the formatted text when a segment can no longer be located", () => {
    const html = render({
      id: "art-lost",
      type: "Artigo",
      index: "4º",
      text: "<p>Art. 4º - Fica criado o <strong>programa</strong> municipal.</p>",
      specialSituations: [],
      segments: [
        {
          start: 0,
          end: 12,
          type: "omission",
          selectedText: "texto inexistente",
        },
      ],
    });

    expect(html).toContain("<strong>programa</strong>");
    expect(html).not.toContain("[...]");
  });
});

describe("NormativeDocumentRenderer (Item 0135 Epígrafe formatting)", () => {
  it("formats epígrafe with type, lowercase nº and full date when number is present", () => {
    const doc: OriginalNormativo = {
      id: "doc-lei",
      type: "original_normativo",
      normativeType: "L",
      number: "12.128",
      actDate: "12.10.2023",
      authorityId: "auth-brasil",
      ementa: "Dispõe sobre...",
      elements: [],
      createdAt: "2023-10-12",
      updatedAt: "2023-10-12",
    };

    const html = renderToStaticMarkup(<NormativeDocumentRenderer data={doc} />);
    expect(html).toContain("Lei");
    expect(html).toContain("nº 12.128");
    expect(html).toContain("de 12 de outubro de 2023");
  });

  it("formats epígrafe with type and full date when number is absent", () => {
    const doc: OriginalNormativo = {
      id: "doc-dec",
      type: "original_normativo",
      normativeType: "D",
      actDate: "03.04.2023",
      authorityId: "auth-brasil",
      ementa: "Regulamenta...",
      elements: [],
      createdAt: "2023-04-03",
      updatedAt: "2023-04-03",
    };

    const html = renderToStaticMarkup(<NormativeDocumentRenderer data={doc} />);
    expect(html).toContain("Decreto");
    expect(html).toContain("de 03 de abril de 2023");
  });
});
