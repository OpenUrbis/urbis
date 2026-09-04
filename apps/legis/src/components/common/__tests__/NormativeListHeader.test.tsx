import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { NormativeListHeader } from "../NormativeListHeader";
import { OriginalNormativo } from "../../../domain/entities";
import { AuthoritiesContext } from "../../../contexts/authorities-context";

vi.mock("wouter", () => ({
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

vi.mock("@open-urbis/map-ui", async () => {
  const actual = await vi.importActual<any>("@open-urbis/map-ui");
  return {
    ...actual,
    TooltipProvider: ({ children }: any) => <>{children}</>,
    Tooltip: ({ children }: any) => <>{children}</>,
    TooltipTrigger: ({ children }: any) => <>{children}</>,
    TooltipContent: ({ children }: any) => <div>{children}</div>,
  };
});

const mockAuthoritiesContext = {
  authorities: [],
  isLoading: false,
  getAuthorityById: (id?: string) => {
    if (id === "auth-brasil") {
      return {
        id: "auth-brasil",
        commonRefAbbr: "BRASIL",
        commonRefFull: "República Federativa do Brasil",
        startDate: "01.01.1988",
      };
    }
    return undefined;
  },
};

describe("NormativeListHeader (Item 0134 formatting)", () => {
  it("formats with authority, normative type, number, year, and name", () => {
    const doc: OriginalNormativo = {
      id: "doc-1",
      type: "original_normativo",
      normativeType: "L",
      number: "12.128",
      actDate: "12.10.2023",
      publicationDate: "13.10.2023",
      authorityId: "auth-brasil",
      name: "Lei do Idoso",
      ementa: "Dispõe sobre o Estatuto da Pessoa Idosa",
      elements: [],
      createdAt: "2023-10-12",
      updatedAt: "2023-10-12",
    };

    const html = renderToStaticMarkup(
      <AuthoritiesContext.Provider value={mockAuthoritiesContext}>
        <NormativeListHeader doc={doc} />
      </AuthoritiesContext.Provider>,
    );

    expect(html).toContain("BRASIL");
    expect(html).toContain("Lei");
    expect(html).toContain("nº 12.128/2023");
    expect(html).toContain("“Lei do Idoso”");
  });

  it("formats with authority, normative type, date, and ementa when there is no number", () => {
    const doc: OriginalNormativo = {
      id: "doc-2",
      type: "original_normativo",
      normativeType: "D",
      actDate: "03.04.2023",
      authorityId: "auth-brasil",
      ementa: "Regulamenta a Lei do Idoso",
      elements: [],
      createdAt: "2023-04-03",
      updatedAt: "2023-04-03",
    };

    const html = renderToStaticMarkup(
      <AuthoritiesContext.Provider value={mockAuthoritiesContext}>
        <NormativeListHeader doc={doc} />
      </AuthoritiesContext.Provider>,
    );

    expect(html).toContain("BRASIL");
    expect(html).toContain("Decreto");
    expect(html).toContain("de 03.04.2023");
    expect(html).toContain("“Regulamenta a Lei do Idoso”");
  });

  it("does not render structural chains (e.g. Título > Capítulo) above the document identification", () => {
    const doc: OriginalNormativo = {
      id: "doc-6001",
      type: "original_normativo",
      normativeType: "L",
      number: "6.001",
      actDate: "19.12.1973",
      publicationDate: "21.12.1973",
      authorityId: "auth-brasil",
      ementa: "Dispõe sobre o Estatuto do Índio.",
      elements: [
        {
          id: "tit-3",
          type: "Título",
          index: "III",
          text: "Das Terras Indígenas",
          specialSituations: [],
        } as any,
        {
          id: "cap-1",
          type: "Capítulo",
          index: "I",
          text: "Disposições Gerais",
          parentId: "tit-3",
          specialSituations: [],
        } as any,
        {
          id: "art-17",
          type: "Artigo",
          index: "17",
          text: "Terras indígenas...",
          parentId: "cap-1",
          specialSituations: [],
        } as any,
      ],
      createdAt: "1973-12-19",
      updatedAt: "1973-12-19",
    };

    const html = renderToStaticMarkup(
      <AuthoritiesContext.Provider value={mockAuthoritiesContext}>
        <NormativeListHeader doc={doc} />
      </AuthoritiesContext.Provider>,
    );

    expect(html).toContain("BRASIL");
    expect(html).toContain("Lei");
    expect(html).toContain("nº 6.001/1973");
    expect(html).toContain("“Dispõe sobre o Estatuto do Índio.”");
    expect(html).not.toContain("Título III");
    expect(html).not.toContain("Capítulo I");
    expect(html).not.toContain(" > ");
  });

  describe("Item 0155 name vs ementa descriptor precedence", () => {
    it("identifies the normative by name when both name and ementa are present", () => {
      const doc: OriginalNormativo = {
        id: "doc-5371",
        type: "original_normativo",
        normativeType: "L",
        number: "5.371",
        actDate: "05.12.1967",
        publicationDate: "06.12.1967",
        authorityId: "auth-brasil",
        name: "Autoriza a instituição da Fundação Nacional do Índio",
        ementa:
          'Autoriza a instituição da "Fundação Nacional do Índio" e dá outras providências.',
        elements: [],
        createdAt: "1967-12-05",
        updatedAt: "1967-12-05",
      };

      const html = renderToStaticMarkup(
        <AuthoritiesContext.Provider value={mockAuthoritiesContext}>
          <NormativeListHeader doc={doc} />
        </AuthoritiesContext.Provider>,
      );

      expect(html).toContain("BRASIL");
      expect(html).toContain("Lei");
      expect(html).toContain("nº 5.371/1967");
      expect(html).toContain("“Autoriza a instituição da Fundação Nacional do Índio”");
      expect(html).not.toContain("dá outras providências");
    });

    it("identifies the normative by title when title is present on entity and name is absent", () => {
      const doc: OriginalNormativo = {
        id: "doc-5371-title",
        type: "original_normativo",
        normativeType: "L",
        number: "5.371",
        actDate: "05.12.1967",
        publicationDate: "06.12.1967",
        authorityId: "auth-brasil",
        title: "Autoriza a instituição da Fundação Nacional do Índio",
        ementa:
          'Autoriza a instituição da "Fundação Nacional do Índio" e dá outras providências.',
        elements: [],
        createdAt: "1967-12-05",
        updatedAt: "1967-12-05",
      };

      const html = renderToStaticMarkup(
        <AuthoritiesContext.Provider value={mockAuthoritiesContext}>
          <NormativeListHeader doc={doc} />
        </AuthoritiesContext.Provider>,
      );

      expect(html).toContain("BRASIL");
      expect(html).toContain("Lei");
      expect(html).toContain("nº 5.371/1967");
      expect(html).toContain("“Autoriza a instituição da Fundação Nacional do Índio”");
      expect(html).not.toContain("dá outras providências");
    });

    it("falls back to ementa when neither name nor title is present", () => {
      const doc: OriginalNormativo = {
        id: "doc-5371-ementa-only",
        type: "original_normativo",
        normativeType: "L",
        number: "5.371",
        actDate: "05.12.1967",
        publicationDate: "06.12.1967",
        authorityId: "auth-brasil",
        ementa:
          'Autoriza a instituição da "Fundação Nacional do Índio" e dá outras providências.',
        elements: [],
        createdAt: "1967-12-05",
        updatedAt: "1967-12-05",
      };

      const html = renderToStaticMarkup(
        <AuthoritiesContext.Provider value={mockAuthoritiesContext}>
          <NormativeListHeader doc={doc} />
        </AuthoritiesContext.Provider>,
      );

      expect(html).toContain("BRASIL");
      expect(html).toContain("Lei");
      expect(html).toContain("nº 5.371/1967");
      expect(html).toContain("Autoriza a instituição da");
      expect(html).toContain("Fundação Nacional do Índio");
      expect(html).toContain("dá outras providências");
    });
  });
});
