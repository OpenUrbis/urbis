import { describe, expect, it } from "vitest";
import { getNormalizedLegisUrl } from "../index";

describe("getNormalizedLegisUrl", () => {
  it("returns null for empty, undefined, or null values", () => {
    expect(getNormalizedLegisUrl(null)).toBeNull();
    expect(getNormalizedLegisUrl(undefined)).toBeNull();
    expect(getNormalizedLegisUrl("")).toBeNull();
    expect(getNormalizedLegisUrl("   ")).toBeNull();
  });

  it("rewrites legislacao.prefeitura.sp.gov.br to legis.urbis.prefeitura.sp.gov.br", () => {
    expect(
      getNormalizedLegisUrl("https://legislacao.prefeitura.sp.gov.br/"),
    ).toBe("https://legis.urbis.prefeitura.sp.gov.br/");

    expect(
      getNormalizedLegisUrl("https://legislacao.prefeitura.sp.gov.br"),
    ).toBe("https://legis.urbis.prefeitura.sp.gov.br");

    expect(
      getNormalizedLegisUrl("http://legislacao.prefeitura.sp.gov.br/"),
    ).toBe("https://legis.urbis.prefeitura.sp.gov.br/");

    expect(
      getNormalizedLegisUrl("legislacao.prefeitura.sp.gov.br"),
    ).toBe("https://legis.urbis.prefeitura.sp.gov.br");

    expect(
      getNormalizedLegisUrl("legislacao.prefeitura.sp.gov.br/"),
    ).toBe("https://legis.urbis.prefeitura.sp.gov.br/");

    expect(
      getNormalizedLegisUrl(
        '<a href="https://legislacao.prefeitura.sp.gov.br/">Legislação</a>',
      ),
    ).toBe("https://legis.urbis.prefeitura.sp.gov.br/");
  });

  it("handles relative pages paths and simple slugs", () => {
    expect(getNormalizedLegisUrl("/pages/zeu")).toBe(
      "https://legis.urbis.prefeitura.sp.gov.br/pages/zeu",
    );
    expect(getNormalizedLegisUrl("/p/12345")).toBe(
      "https://legis.urbis.prefeitura.sp.gov.br/p/12345",
    );
    expect(getNormalizedLegisUrl("zeu")).toBe(
      "https://legis.urbis.prefeitura.sp.gov.br/pages/zeu",
    );
  });

  it("preserves standard legis URLs and other valid URLs", () => {
    expect(
      getNormalizedLegisUrl(
        "https://legis.urbis.prefeitura.sp.gov.br/pages/zeu",
      ),
    ).toBe("https://legis.urbis.prefeitura.sp.gov.br/pages/zeu");
  });
});
