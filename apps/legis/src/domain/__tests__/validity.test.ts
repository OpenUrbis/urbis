import { describe, expect, it } from "vitest";
import type { OriginalNormativo, Validity } from "../types";
import {
  createEmptyValidity,
  formatValidityDate,
  formatValidityDisplay,
  hasValidityValue,
  resolveLinkedElementDate,
  updateValidityNormativeElement,
} from "../validity";

function makeValidity(overrides: Partial<Validity> = {}): Validity {
  return {
    ...createEmptyValidity(),
    ...overrides,
  };
}

describe("createEmptyValidity", () => {
  it("starts every field as an empty string, never undefined", () => {
    expect(createEmptyValidity()).toEqual({
      date: "",
      deviceId: "",
      normativeElementId: "",
    });
  });

  it("returns a fresh object on every call, so callers cannot share state", () => {
    const first = createEmptyValidity();
    const second = createEmptyValidity();

    first.date = "01.01.2026";

    expect(second.date).toBe("");
    expect(first).not.toBe(second);
  });
});

describe("hasValidityValue", () => {
  it("is false for an empty validity", () => {
    expect(hasValidityValue(createEmptyValidity())).toBe(false);
  });

  it("is false when nothing is given at all", () => {
    expect(hasValidityValue()).toBe(false);
    expect(hasValidityValue(undefined)).toBe(false);
    expect(hasValidityValue({})).toBe(false);
  });

  it("is true when only the date is filled", () => {
    expect(hasValidityValue({ date: "01.01.2026" })).toBe(true);
  });

  it("is true when only the normative element is filled", () => {
    expect(hasValidityValue({ normativeElementId: "el-1" })).toBe(true);
  });

  it("is true when only the legacy device is filled", () => {
    expect(hasValidityValue({ deviceId: "Art. 1º" })).toBe(true);
  });

  it('treats free-text dates such as "vigência condicionada" as a value', () => {
    expect(hasValidityValue({ date: "vigência condicionada" })).toBe(true);
  });

  it("counts whitespace-only fields as filled, because it does not trim", () => {
    expect(hasValidityValue({ date: " " })).toBe(true);
    expect(hasValidityValue({ normativeElementId: " " })).toBe(true);
    expect(hasValidityValue({ deviceId: " " })).toBe(true);
  });

  it("ignores fields that are not part of the emptiness check", () => {
    expect(hasValidityValue({ trechos: [{ start: 0, end: 10 }] })).toBe(false);
  });
});

describe("updateValidityNormativeElement", () => {
  it("sets the normative element, mirrors the linked label into deviceId, and sets linkedDate if provided", () => {
    const result = updateValidityNormativeElement(
      makeValidity({ date: "01.01.2026" }),
      "el-1",
      "Art. 1º da Lei nº 16.402/2016",
      "15.05.2016",
    );

    expect(result).toEqual({
      date: "15.05.2016",
      deviceId: "Art. 1º da Lei nº 16.402/2016",
      normativeElementId: "el-1",
    });
  });

  it("keeps the previous deviceId when no linked label is provided", () => {
    const result = updateValidityNormativeElement(
      makeValidity({ date: "01.01.2026", deviceId: "Art. 1º (legado)" }),
      "el-1",
    );

    expect(result.normativeElementId).toBe("el-1");
    expect(result.deviceId).toBe("Art. 1º (legado)");
  });

  it("overrides an existing deviceId with the new linked label", () => {
    const result = updateValidityNormativeElement(
      makeValidity({ deviceId: "Art. 1º (legado)" }),
      "el-2",
      "Art. 2º",
    );

    expect(result.deviceId).toBe("Art. 2º");
  });

  it("lets an empty linked label win over the previous deviceId", () => {
    const result = updateValidityNormativeElement(
      makeValidity({ deviceId: "Art. 1º (legado)" }),
      "el-2",
      "",
    );

    expect(result.deviceId).toBe("");
  });

  it("clears both identifiers when the normative element id is empty", () => {
    const result = updateValidityNormativeElement(
      makeValidity({
        date: "01.01.2026",
        deviceId: "Art. 1º",
        normativeElementId: "el-1",
      }),
      "",
    );

    expect(result).toEqual({
      date: "01.01.2026",
      deviceId: "",
      normativeElementId: "",
    });
  });

  it("ignores the linked label while clearing", () => {
    const result = updateValidityNormativeElement(
      makeValidity({ deviceId: "Art. 1º" }),
      "",
      "Art. 9º",
    );

    expect(result.deviceId).toBe("");
    expect(result.normativeElementId).toBe("");
  });

  it("builds on an empty validity when none is given", () => {
    expect(
      updateValidityNormativeElement(undefined, "el-1", "Art. 1º"),
    ).toEqual({
      date: "",
      deviceId: "Art. 1º",
      normativeElementId: "el-1",
    });
  });

  it("produces an empty validity when there is neither input nor id", () => {
    expect(updateValidityNormativeElement(undefined, "")).toEqual(
      createEmptyValidity(),
    );
  });

  it("preserves unrelated fields such as trechos", () => {
    const trechos = [{ start: 0, end: 5 }];
    const result = updateValidityNormativeElement(
      makeValidity({ trechos }),
      "el-1",
      "Art. 1º",
    );

    expect(result.trechos).toEqual(trechos);
  });

  it("does not mutate the validity it receives", () => {
    const original = makeValidity({ date: "01.01.2026", deviceId: "Art. 1º" });
    const result = updateValidityNormativeElement(original, "el-1", "Art. 2º");

    expect(original).toEqual({
      date: "01.01.2026",
      deviceId: "Art. 1º",
      normativeElementId: "",
    });
    expect(result).not.toBe(original);
  });
});

describe("formatValidityDate", () => {
  it('says "sem data" when there is no date', () => {
    expect(formatValidityDate()).toBe("sem data");
    expect(formatValidityDate(undefined)).toBe("sem data");
    expect(formatValidityDate("")).toBe("sem data");
    expect(formatValidityDate("", true)).toBe("sem data");
  });

  it("keeps a valid dd.MM.yyyy date in the short form by default", () => {
    expect(formatValidityDate("22.03.2016")).toBe("22.03.2016");
  });

  it("normalises a loosely written date into the padded short form", () => {
    expect(formatValidityDate("1.1.2026")).toBe("01.01.2026");
  });

  it("spells the date out in Portuguese when asked for the full form", () => {
    expect(formatValidityDate("01.01.2026", true)).toBe("1 de janeiro de 2026");
    expect(formatValidityDate("07.07.2017", true)).toBe("7 de julho de 2017");
    expect(formatValidityDate("31.12.1999", true)).toBe(
      "31 de dezembro de 1999",
    );
  });

  it("passes free-text values through untouched", () => {
    expect(formatValidityDate("vigência condicionada")).toBe(
      "vigência condicionada",
    );
    expect(formatValidityDate("vigência condicionada", true)).toBe(
      "vigência condicionada",
    );
  });

  it("passes garbage through instead of inventing a date", () => {
    expect(formatValidityDate("not-a-date")).toBe("not-a-date");
    expect(formatValidityDate("2016-03-22")).toBe("2016-03-22");
    expect(formatValidityDate("01.01.2026 e mais texto")).toBe(
      "01.01.2026 e mais texto",
    );
  });

  it("passes impossible calendar dates through rather than rolling them over", () => {
    expect(formatValidityDate("31.02.2026")).toBe("31.02.2026");
    expect(formatValidityDate("01.13.2026")).toBe("01.13.2026");
    expect(formatValidityDate("00.01.2026")).toBe("00.01.2026");
  });

  it('returns whitespace-only input verbatim, since only falsy input becomes "sem data"', () => {
    expect(formatValidityDate("   ")).toBe("   ");
  });
});

describe("formatValidityDisplay", () => {
  it('says "não definida" when there is no validity object', () => {
    expect(formatValidityDisplay()).toBe("não definida");
    expect(formatValidityDisplay(undefined)).toBe("não definida");
  });

  it('shows only "sem data" for an empty validity', () => {
    expect(formatValidityDisplay(createEmptyValidity())).toBe("sem data");
  });

  it("shows the date alone when no element is linked", () => {
    expect(formatValidityDisplay(makeValidity({ date: "22.03.2016" }))).toBe(
      "22.03.2016",
    );
  });

  it("appends the normative element after a middle dot", () => {
    expect(
      formatValidityDisplay(
        makeValidity({ date: "22.03.2016", normativeElementId: "el-1" }),
      ),
    ).toBe("22.03.2016 · elemento: el-1");
  });

  it("falls back to the legacy device when there is no normative element", () => {
    expect(
      formatValidityDisplay(
        makeValidity({ date: "22.03.2016", deviceId: "Art. 1º" }),
      ),
    ).toBe("22.03.2016 · dispositivo: Art. 1º");
  });

  it("prefers the normative element over the legacy device", () => {
    expect(
      formatValidityDisplay(
        makeValidity({
          date: "22.03.2016",
          deviceId: "Art. 1º",
          normativeElementId: "el-1",
        }),
      ),
    ).toBe("22.03.2016 · elemento: el-1");
  });

  it("mentions the element even when there is no date", () => {
    expect(
      formatValidityDisplay(makeValidity({ normativeElementId: "el-1" })),
    ).toBe("sem data · elemento: el-1");
  });

  it("trims the element id before deciding it is present, and before printing it", () => {
    expect(
      formatValidityDisplay(makeValidity({ normativeElementId: "  el-1  " })),
    ).toBe("sem data · elemento: el-1");
  });

  it("trims the legacy device id as well", () => {
    expect(
      formatValidityDisplay(makeValidity({ deviceId: "  Art. 1º  " })),
    ).toBe("sem data · dispositivo: Art. 1º");
  });

  it("ignores whitespace-only identifiers, falling through to the legacy device", () => {
    expect(
      formatValidityDisplay(
        makeValidity({ normativeElementId: "   ", deviceId: "Art. 1º" }),
      ),
    ).toBe("sem data · dispositivo: Art. 1º");
  });

  it("drops both identifiers when both are whitespace-only", () => {
    expect(
      formatValidityDisplay(
        makeValidity({ normativeElementId: "   ", deviceId: "   " }),
      ),
    ).toBe("sem data");
  });

  it('does not trim a whitespace-only date, so it reads as blank instead of "sem data"', () => {
    expect(
      formatValidityDisplay(
        makeValidity({ date: "   ", normativeElementId: "el-1" }),
      ),
    ).toBe("    · elemento: el-1");
  });

  it("keeps a free-text date as written next to the element", () => {
    expect(
      formatValidityDisplay(
        makeValidity({
          date: "vigência condicionada",
          normativeElementId: "el-1",
        }),
      ),
    ).toBe("vigência condicionada · elemento: el-1");
  });

  it("tolerates a legacy validity whose optional fields are missing", () => {
    const legacy = { date: "22.03.2016" } as unknown as Validity;

    expect(formatValidityDisplay(legacy)).toBe("22.03.2016");
  });
});

describe("resolveLinkedElementDate", () => {
  const mockDoc: OriginalNormativo = {
    id: "doc-1",
    type: "original_normativo",
    normativeType: "L",
    number: "16000",
    actDate: "15.05.2014",
    authorityId: "auth-1",
    ementa: "Ementa",
    elements: [
      {
        id: "el-with-date",
        type: "Artigo",
        text: "Art. 1º",
        originalStartValidity: { date: "01.01.2020", deviceId: "" },
        specialSituations: [],
      },
      {
        id: "el-no-date",
        type: "Artigo",
        text: "Art. 2º",
        originalStartValidity: { date: "", deviceId: "" },
        specialSituations: [],
      },
    ],
    createdAt: "",
    updatedAt: "",
  };

  it("returns element's own validity date when present", () => {
    const date = resolveLinkedElementDate(mockDoc, "el-with-date");
    expect(date).toBe("01.01.2020");
  });

  it("prefers the latest effective start alteration over the source act date", () => {
    const date = resolveLinkedElementDate(
      {
        ...mockDoc,
        elements: [
          {
            ...mockDoc.elements[0],
            specialSituations: [
              { type: "Vigência inicial alterada", date: "01.01.2030" },
            ],
          },
        ],
      },
      "el-with-date",
    );

    expect(date).toBe("01.01.2030");
  });

  it("keeps a conditional effective start explicit", () => {
    const date = resolveLinkedElementDate(
      {
        ...mockDoc,
        elements: [
          {
            ...mockDoc.elements[0],
            specialSituations: [
              { type: "Vigência inicial alterada", date: "vigência condicionada" },
            ],
          },
        ],
      },
      "el-with-date",
    );

    expect(date).toBe("vigência condicionada");
  });

  it("falls back to document's general actDate when element date is missing", () => {
    const date = resolveLinkedElementDate(mockDoc, "el-no-date");
    expect(date).toBe("15.05.2014");
  });

  it("returns document's general actDate when no elementId is given", () => {
    const date = resolveLinkedElementDate(mockDoc, null);
    expect(date).toBe("15.05.2014");
  });

  it("returns empty string when document is undefined", () => {
    expect(resolveLinkedElementDate(undefined, "el-1")).toBe("");
  });
});
