import { describe, expect, it } from "vitest";
import { NORMATIVE_TYPES } from "@/data/normative-types";
import {
  formatNormativeDate,
  getAuthorityFullLabel,
  getAuthorityShortLabel,
  getNormativeDesignation,
  getNormativeTypeLabel,
  getNormativeYear,
} from "../normative-labels";

describe("formatNormativeDate", () => {
  it("spells a dd.MM.yyyy date out in Portuguese", () => {
    expect(formatNormativeDate("22.03.2016")).toBe("22 de março de 2016");
    expect(formatNormativeDate("01.01.2026")).toBe("1 de janeiro de 2026");
    expect(formatNormativeDate("07.07.2017")).toBe("7 de julho de 2017");
  });

  it("does not pad the day, matching the Legis reading style", () => {
    expect(formatNormativeDate("09.08.2021")).toBe("9 de agosto de 2021");
  });

  it("accepts a loosely written date", () => {
    expect(formatNormativeDate("1.1.2026")).toBe("1 de janeiro de 2026");
  });

  it("returns an empty string when there is no date", () => {
    expect(formatNormativeDate()).toBe("");
    expect(formatNormativeDate(undefined)).toBe("");
    expect(formatNormativeDate("")).toBe("");
  });

  it("passes unparseable values through untouched", () => {
    expect(formatNormativeDate("sem data")).toBe("sem data");
    expect(formatNormativeDate("2016-03-22")).toBe("2016-03-22");
    expect(formatNormativeDate("22/03/2016")).toBe("22/03/2016");
    expect(formatNormativeDate("   ")).toBe("   ");
  });

  it("passes impossible calendar dates through instead of rolling them over", () => {
    expect(formatNormativeDate("31.02.2026")).toBe("31.02.2026");
    expect(formatNormativeDate("01.13.2026")).toBe("01.13.2026");
  });
});

describe("getAuthorityShortLabel", () => {
  it("returns an empty string when there is no authority", () => {
    expect(getAuthorityShortLabel()).toBe("");
    expect(getAuthorityShortLabel(undefined)).toBe("");
    expect(getAuthorityShortLabel(null)).toBe("");
  });

  it("uses the common reference abbreviation", () => {
    expect(getAuthorityShortLabel({ commonRefAbbr: "PMSP" })).toBe("PMSP");
  });

  it("prefers the common reference over the complement when both exist", () => {
    expect(
      getAuthorityShortLabel({ commonRefAbbr: "PMSP", complementAbbr: "SMUL" }),
    ).toBe("PMSP");
  });

  it("falls back to the complement abbreviation when the common reference is blank", () => {
    expect(
      getAuthorityShortLabel({ commonRefAbbr: "", complementAbbr: "SMUL" }),
    ).toBe("SMUL");
  });

  it("returns an empty string when both abbreviations are blank", () => {
    expect(
      getAuthorityShortLabel({ commonRefAbbr: "", complementAbbr: "" }),
    ).toBe("");
    expect(getAuthorityShortLabel({ commonRefAbbr: "" })).toBe("");
  });
});

describe("getAuthorityFullLabel", () => {
  it("returns an empty string when there is no authority", () => {
    expect(getAuthorityFullLabel()).toBe("");
    expect(getAuthorityFullLabel(undefined)).toBe("");
    expect(getAuthorityFullLabel(null)).toBe("");
  });

  it("joins the complement before the common reference", () => {
    expect(
      getAuthorityFullLabel({
        commonRefFull: "Prefeitura do Município de São Paulo",
        complementFull: "Secretaria Municipal de Urbanismo e Licenciamento",
      }),
    ).toBe(
      "Secretaria Municipal de Urbanismo e Licenciamento - Prefeitura do Município de São Paulo",
    );
  });

  it("uses the common reference alone when there is no complement", () => {
    expect(
      getAuthorityFullLabel({ commonRefFull: "Câmara Municipal de São Paulo" }),
    ).toBe("Câmara Municipal de São Paulo");
  });

  it("drops a blank complement instead of leaving a dangling separator", () => {
    expect(
      getAuthorityFullLabel({
        commonRefFull: "Câmara Municipal de São Paulo",
        complementFull: "",
      }),
    ).toBe("Câmara Municipal de São Paulo");
  });

  it("uses the complement alone when the common reference is blank", () => {
    expect(
      getAuthorityFullLabel({
        commonRefFull: "",
        complementFull: "Gabinete do Prefeito",
      }),
    ).toBe("Gabinete do Prefeito");
  });

  it("returns an empty string when both parts are blank", () => {
    expect(
      getAuthorityFullLabel({ commonRefFull: "", complementFull: "" }),
    ).toBe("");
  });
});

describe("getNormativeYear", () => {
  it("reads the year of a valid dd.MM.yyyy date", () => {
    expect(getNormativeYear("22.03.2016")).toBe("2016");
    expect(getNormativeYear("31.12.1999")).toBe("1999");
  });

  it("returns an empty string when there is no date", () => {
    expect(getNormativeYear()).toBe("");
    expect(getNormativeYear(undefined)).toBe("");
    expect(getNormativeYear("")).toBe("");
  });

  it("recovers a trailing four-digit year from unparseable text", () => {
    expect(getNormativeYear("vigência a partir de 2026")).toBe("2026");
    expect(getNormativeYear("2016")).toBe("2016");
    expect(getNormativeYear("março de 2016")).toBe("2016");
  });

  it("recovers the year even from an impossible calendar date, since the tail matches", () => {
    expect(getNormativeYear("31.02.2026")).toBe("2026");
  });

  it("takes only the last four digits of a longer trailing number", () => {
    expect(getNormativeYear("protocolo 123456")).toBe("3456");
  });

  it("returns an empty string when no year can be found", () => {
    expect(getNormativeYear("sem data")).toBe("");
    expect(getNormativeYear("vigência condicionada")).toBe("");
    expect(getNormativeYear("   ")).toBe("");
  });

  it("does not find a year that is not at the end of the string", () => {
    expect(getNormativeYear("2016-03-22")).toBe("");
  });
});

describe("getNormativeTypeLabel", () => {
  it("expands a known normative type code", () => {
    expect(getNormativeTypeLabel("L")).toBe("Lei");
    expect(getNormativeTypeLabel("LC")).toBe("Lei Complementar");
    expect(getNormativeTypeLabel("D")).toBe("Decreto");
    expect(getNormativeTypeLabel("PORT")).toBe("Portaria");
  });

  it("agrees with the shared normative type table", () => {
    for (const [code, label] of Object.entries(NORMATIVE_TYPES)) {
      expect(getNormativeTypeLabel(code)).toBe(label);
    }
  });

  it("passes an unknown code through as-is", () => {
    expect(getNormativeTypeLabel("XPTO")).toBe("XPTO");
    expect(getNormativeTypeLabel("lei")).toBe("lei");
  });

  it("returns an empty string when there is no code", () => {
    expect(getNormativeTypeLabel()).toBe("");
    expect(getNormativeTypeLabel(undefined)).toBe("");
    expect(getNormativeTypeLabel("")).toBe("");
  });
});

describe("getNormativeDesignation", () => {
  it("is just the type label when there is no number", () => {
    expect(getNormativeDesignation({ normativeType: "L" })).toBe("Lei");
    expect(
      getNormativeDesignation({ normativeType: "L", actDate: "22.03.2016" }),
    ).toBe("Lei");
  });

  it("is an empty string when there is neither type nor number", () => {
    expect(getNormativeDesignation({})).toBe("");
  });

  it("composes type, number and the year of the act date", () => {
    expect(
      getNormativeDesignation({
        normativeType: "L",
        number: "16.402",
        actDate: "22.03.2016",
      }),
    ).toBe("Lei nº 16.402/2016");
  });

  it("falls back to the publication date when there is no act date", () => {
    expect(
      getNormativeDesignation({
        normativeType: "D",
        number: "57.776",
        publicationDate: "08.07.2017",
      }),
    ).toBe("Decreto nº 57.776/2017");
  });

  it("treats a blank act date as absent and uses the publication date", () => {
    expect(
      getNormativeDesignation({
        normativeType: "D",
        number: "57.776",
        actDate: "",
        publicationDate: "08.07.2017",
      }),
    ).toBe("Decreto nº 57.776/2017");
  });

  it("prefers the act date over the publication date", () => {
    expect(
      getNormativeDesignation({
        normativeType: "L",
        number: "16.402",
        actDate: "22.03.2016",
        publicationDate: "23.03.2017",
      }),
    ).toBe("Lei nº 16.402/2016");
  });

  it("omits the year when no date resolves to one", () => {
    expect(
      getNormativeDesignation({ normativeType: "PORT", number: "12" }),
    ).toBe("Portaria nº 12");
    expect(
      getNormativeDesignation({
        normativeType: "PORT",
        number: "12",
        actDate: "sem data",
      }),
    ).toBe("Portaria nº 12");
  });

  it("still recovers the year from a free-text act date ending in a year", () => {
    expect(
      getNormativeDesignation({
        normativeType: "RES",
        number: "5",
        actDate: "dezembro de 2021",
      }),
    ).toBe("Resolução nº 5/2021");
  });

  it("keeps an unknown type code in the designation", () => {
    expect(
      getNormativeDesignation({
        normativeType: "XPTO",
        number: "1",
        actDate: "01.01.2020",
      }),
    ).toBe("XPTO nº 1/2020");
  });

  it("trims the leading space when the type label is unknown-empty", () => {
    expect(
      getNormativeDesignation({ number: "5", actDate: "01.01.2020" }),
    ).toBe("nº 5/2020");
    expect(getNormativeDesignation({ number: "5" })).toBe("nº 5");
  });
});
