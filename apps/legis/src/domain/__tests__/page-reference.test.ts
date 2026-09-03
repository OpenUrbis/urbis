import { describe, expect, it } from "vitest";
import type { ColetaneaTematica, OriginalNormativo } from "../entities";
import { formatPageReference } from "../page-reference";
import type { Page } from "../../types/page";

function makePage(overrides: Partial<Page> = {}): Page {
  return {
    id: "page-1",
    title: "Regulamentação do COE",
    content: "",
    slug: "regulamentacao-coe",
    type: "original_normativo",
    author: "pref-sp",
    tags: [],
    isPublic: true,
    createdAt: "",
    updatedAt: "",
    ...overrides,
  } as Page;
}

function makeNormativo(
  overrides: Partial<OriginalNormativo> = {},
): OriginalNormativo {
  return {
    id: "page-1",
    type: "original_normativo",
    normativeType: "D",
    number: "57.776",
    actDate: "07.07.2017",
    authorityId: "pref-sp",
    ementa: "Regulamenta a Lei nº 16.642.",
    elements: [],
    createdAt: "",
    updatedAt: "",
    ...overrides,
  } as OriginalNormativo;
}

function makeColetanea(
  overrides: Partial<ColetaneaTematica> = {},
): ColetaneaTematica {
  return {
    id: "page-2",
    type: "coletanea_tematica",
    title: "Exigências para habitação de interesse social",
    collectionType: "Exigências",
    category: "Habitação",
    theme: "HIS",
    links: [],
    createdAt: "",
    updatedAt: "",
    ...overrides,
  } as ColetaneaTematica;
}

describe("formatPageReference", () => {
  it("uses the Legis designation for normative originals", () => {
    const reference = formatPageReference(
      makePage({ entity: makeNormativo() }),
    );

    expect(reference).toEqual({
      id: "page-1",
      label: "Decreto nº 57.776/2017",
      title: "Regulamentação do COE",
      href: "/pages/page-1",
    });
  });

  it("falls back to the publication date when composing the designation", () => {
    const reference = formatPageReference(
      makePage({
        entity: makeNormativo({
          actDate: undefined,
          publicationDate: "08.07.2017",
        }),
      }),
    );

    expect(reference.label).toBe("Decreto nº 57.776/2017");
  });

  it("omits the year in the designation when no date resolves to one", () => {
    const reference = formatPageReference(
      makePage({
        entity: makeNormativo({
          normativeType: "PORT",
          number: "12",
          actDate: undefined,
        }),
      }),
    );

    expect(reference.label).toBe("Portaria nº 12");
  });

  it("falls back to the page title when the normative original has no number", () => {
    const reference = formatPageReference(
      makePage({
        entity: makeNormativo({ number: undefined }),
      }),
    );

    expect(reference.label).toBe("Regulamentação do COE");
  });

  it("falls back to the page title when there is no entity at all", () => {
    expect(formatPageReference(makePage({ entity: undefined })).label).toBe(
      "Regulamentação do COE",
    );
  });

  it("ignores a normative entity when the page is not typed as a normative original", () => {
    const reference = formatPageReference(
      makePage({
        type: "page",
        title: "Notas de leitura",
        entity: makeNormativo(),
      }),
    );

    expect(reference.label).toBe("Notas de leitura");
  });

  it("uses the coletânea title, not the page title", () => {
    const reference = formatPageReference(
      makePage({
        id: "page-2",
        title: "Título da página",
        type: "coletanea_tematica",
        entity: makeColetanea(),
      }),
    );

    expect(reference).toEqual({
      id: "page-2",
      label: "Exigências para habitação de interesse social",
      title: "Título da página",
      href: "/pages/page-2",
    });
  });

  it("trims the coletânea title", () => {
    const reference = formatPageReference(
      makePage({
        type: "coletanea_tematica",
        entity: makeColetanea({ title: "  Definições urbanísticas  " }),
      }),
    );

    expect(reference.label).toBe("Definições urbanísticas");
  });

  it("falls back to the page title when the coletânea title is blank", () => {
    const reference = formatPageReference(
      makePage({
        title: "Coletânea sem nome próprio",
        type: "coletanea_tematica",
        entity: makeColetanea({ title: "   " }),
      }),
    );

    expect(reference.label).toBe("Coletânea sem nome próprio");
  });

  it("ignores a coletânea entity when the page is not typed as a coletânea", () => {
    const reference = formatPageReference(
      makePage({
        type: "page",
        title: "Página comum",
        entity: makeColetanea(),
      }),
    );

    expect(reference.label).toBe("Página comum");
  });

  it('says "Sem título" when the title is blank, and never exposes the identifier', () => {
    const reference = formatPageReference(
      makePage({
        id: "lei_revisao_zoneamento",
        title: "  ",
        entity: undefined,
      }),
    );

    expect(reference.label).toBe("Sem título");
    expect(reference.title).toBe("Sem título");
    expect(reference.href).toBe("/pages/lei_revisao_zoneamento");
  });

  it('says "Sem título" when the title is missing entirely', () => {
    const reference = formatPageReference(
      makePage({
        title: undefined,
        entity: undefined,
      }),
    );

    expect(reference.label).toBe("Sem título");
    expect(reference.title).toBe("Sem título");
  });

  it("trims the title used for the tooltip", () => {
    const reference = formatPageReference(
      makePage({
        title: "  Regulamentação do COE  ",
        entity: undefined,
      }),
    );

    expect(reference.title).toBe("Regulamentação do COE");
    expect(reference.label).toBe("Regulamentação do COE");
  });

  it("leaves a short label untouched", () => {
    const reference = formatPageReference(
      makePage({ title: "Lei nº 16.050", entity: undefined }),
    );

    expect(reference.label).toBe("Lei nº 16.050");
    expect(reference.label).not.toContain("…");
  });

  it("leaves a label of exactly the 70-character limit untouched", () => {
    const title = "Lei de uso e ocupação do solo urbano "
      .repeat(3)
      .slice(0, 70);
    const reference = formatPageReference(
      makePage({ title, entity: undefined }),
    );

    expect(title).toHaveLength(70);
    expect(reference.label).toBe(title);
    expect(reference.label).not.toContain("…");
  });

  it("truncates a longer label to 70 characters plus an ellipsis", () => {
    const title = `${"Lei de uso e ocupação do solo urbano ".repeat(3).slice(0, 70)}!`;
    const reference = formatPageReference(
      makePage({ title, entity: undefined }),
    );

    expect(title).toHaveLength(71);
    expect(reference.label).toBe(`${title.slice(0, 70)}…`);
    expect(reference.label).toHaveLength(71);
  });

  it("truncates a long title instead of breaking the line, keeping the full title for the tooltip", () => {
    const title =
      "Lei que dispõe sobre o parcelamento, uso e ocupação do solo urbano no Município";
    const reference = formatPageReference(
      makePage({ title, entity: undefined }),
    );

    expect(reference.label.endsWith("…")).toBe(true);
    expect(reference.label.length).toBeLessThanOrEqual(71);
    expect(reference.title).toBe(title);
  });

  it("drops trailing whitespace before the ellipsis when the cut lands on a space", () => {
    const title = `${"x".repeat(69)} palavra`;
    const reference = formatPageReference(
      makePage({ title, entity: undefined }),
    );

    expect(title.slice(0, 70).endsWith(" ")).toBe(true);
    expect(reference.label).toBe(`${"x".repeat(69)}…`);
  });

  it("truncates a long designation as well", () => {
    const reference = formatPageReference(
      makePage({
        entity: makeNormativo({
          normativeType: "ADO",
          number: "1.234.567.890",
          actDate: "01.01.2020",
        }),
      }),
    );

    expect(
      reference.label.startsWith("Ação Declaratória de Inconstitucionalidade"),
    ).toBe(true);
    expect(reference.label.endsWith("…")).toBe(true);
    expect(reference.label).toHaveLength(71);
  });

  it("builds the href from the page id, whatever the label is", () => {
    expect(formatPageReference(makePage({ id: "abc-123" })).href).toBe(
      "/pages/abc-123",
    );
    expect(formatPageReference(makePage({ id: "" })).href).toBe("/pages/");
  });
});
