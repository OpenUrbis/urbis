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
});
