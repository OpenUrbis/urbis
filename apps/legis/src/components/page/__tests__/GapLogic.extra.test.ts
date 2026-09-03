import { describe, expect, it } from "vitest";
import {
  GapItem,
  checkGap,
  getIndexValue,
  processGaps,
  processGapsUnified,
  romanToDecimal,
} from "../GapLogic";
import { ElementType, NormativeElementEntity } from "../../../domain/entities";

const createElement = (
  id: string,
  type: ElementType,
  index: string,
  parentId?: string,
): NormativeElementEntity => ({
  id,
  type,
  index,
  text: `Texto de ${id}`,
  parentId,
  originalStartValidity: { date: "01.01.2020", deviceId: "Lei 1" },
  specialSituations: [],
});

const createInciso = (id: string, index: string, parentId = "art-1") =>
  createElement(id, "Inciso", index, parentId);

const isGap = (item: NormativeElementEntity | GapItem): item is GapItem =>
  item.type === "Gap";

const gapIds = (items: (NormativeElementEntity | GapItem)[]) =>
  items.filter(isGap).map((item) => item.id);

const itemIds = (items: (NormativeElementEntity | GapItem)[]) =>
  items.map((item) => item.id);

describe("GapLogic (extra)", () => {
  describe("romanToDecimal", () => {
    it.each([
      ["I", 1],
      ["III", 3],
      ["IV", 4],
      ["IX", 9],
      ["XIV", 14],
      ["XL", 40],
      ["XLII", 42],
      ["MCMXCIV", 1994],
    ])("converts the canonical numeral %s to %i", (roman, expected) => {
      expect(romanToDecimal(roman)).toBe(expected);
    });

    it("is case-insensitive and trims surrounding whitespace", () => {
      expect(romanToDecimal("  xiv  ")).toBe(14);
      expect(romanToDecimal("iv")).toBe(romanToDecimal("IV"));
    });

    it("returns 0 for an empty string", () => {
      expect(romanToDecimal("")).toBe(0);
      expect(romanToDecimal("   ")).toBe(0);
    });

    it("treats unknown characters as zero instead of failing", () => {
      expect(romanToDecimal("ABZ")).toBe(0);
      // 'A' contributes 0 and also resets the "previous value" used for subtraction.
      expect(romanToDecimal("IA")).toBe(1);
      // Known roman letters inside a nonsense string still count.
      expect(romanToDecimal("ABC")).toBe(100);
    });

    it("accepts non-canonical numerals (additive fallback)", () => {
      expect(romanToDecimal("IIII")).toBe(4);
      // Only the digit immediately to the right is used for subtraction,
      // so 'IIX' is read as (-1 + 1) + 10.
      expect(romanToDecimal("IIX")).toBe(10);
    });
  });

  describe("getIndexValue", () => {
    it("returns null when the index is empty or blank", () => {
      expect(getIndexValue("Artigo", "")).toBeNull();
      expect(getIndexValue("Inciso", "   ")).toBeNull();
    });

    it("reads Inciso indexes as roman numerals, ignoring separators", () => {
      expect(getIndexValue("Inciso", "IV")).toBe(4);
      expect(getIndexValue("Inciso", "IV.")).toBe(4);
      expect(getIndexValue("Inciso", "XIV)")).toBe(14);
      expect(getIndexValue("Inciso", "iv")).toBe(4);
    });

    it("falls back to integer parsing for numeric Inciso indexes", () => {
      expect(getIndexValue("Inciso", "4")).toBe(4);
    });

    it("returns null for Inciso indexes that are neither roman nor numeric", () => {
      expect(getIndexValue("Inciso", "abc")).toBeNull();
    });

    it("reads Alínea indexes as letters (a = 1)", () => {
      expect(getIndexValue("Alínea", "a")).toBe(1);
      expect(getIndexValue("Alínea", "b)")).toBe(2);
      expect(getIndexValue("Alínea", "B")).toBe(2);
      expect(getIndexValue("Alínea", "z")).toBe(26);
    });

    it("returns null for multi-letter Alínea indexes", () => {
      expect(getIndexValue("Alínea", "ab")).toBeNull();
    });

    it("resolves the same character differently depending on the element type", () => {
      // 'i' is the 9th letter, but the 1st roman numeral.
      expect(getIndexValue("Alínea", "i")).toBe(9);
      expect(getIndexValue("Inciso", "i")).toBe(1);
      expect(getIndexValue("Alínea", "c")).toBe(3);
      expect(getIndexValue("Inciso", "C")).toBe(100);
    });

    it("does not convert roman numerals for types other than Inciso", () => {
      expect(getIndexValue("Capítulo", "IV")).toBeNull();
      expect(getIndexValue("Seção", "II")).toBeNull();
    });

    it('maps "único" to 1 regardless of casing', () => {
      expect(getIndexValue("Parágrafo", "único")).toBe(1);
      expect(getIndexValue("Parágrafo", "Único")).toBe(1);
      expect(getIndexValue("Parágrafo", "parágrafo único")).toBeNull();
    });

    it("strips ordinal markers and trailing punctuation from numeric indexes", () => {
      expect(getIndexValue("Artigo", "1º")).toBe(1);
      expect(getIndexValue("Artigo", "2°")).toBe(2);
      expect(getIndexValue("Artigo", "10.")).toBe(10);
      expect(getIndexValue("Item", "2)")).toBe(2);
    });

    it("parses only the leading integer of a mixed index", () => {
      expect(getIndexValue("Artigo", "3-A")).toBe(3);
    });

    it("collapses dots of hierarchical indexes into a single number (known quirk)", () => {
      // '.' is stripped as a separator, so '1.1' becomes '11'.
      expect(getIndexValue("Inciso", "1.1")).toBe(11);
      expect(getIndexValue("Inciso", "1.10")).toBe(110);
    });
  });

  describe("checkGap", () => {
    it("ignores elements of different types", () => {
      const prev = createElement("art-1", "Artigo", "1º", "cap-1");
      const curr = createElement("inc-5", "Inciso", "V", "cap-1");

      expect(checkGap(prev, curr)).toBe(false);
    });

    it("ignores elements with different parents", () => {
      expect(
        checkGap(
          createInciso("a", "I", "art-1"),
          createInciso("b", "III", "art-2"),
        ),
      ).toBe(false);
      expect(
        checkGap(
          createInciso("a", "I", undefined),
          createInciso("b", "III", "art-2"),
        ),
      ).toBe(false);
    });

    it("compares siblings sharing an undefined parent", () => {
      const prev = createElement("art-1", "Artigo", "1º");
      const curr = createElement("art-3", "Artigo", "3º");

      expect(checkGap(prev, curr)).toBe(true);
    });

    it("detects a simple numbering jump and accepts consecutive siblings", () => {
      expect(checkGap(createInciso("a", "I"), createInciso("b", "III"))).toBe(
        true,
      );
      expect(checkGap(createInciso("a", "I"), createInciso("b", "II"))).toBe(
        false,
      );
    });

    it("does not report a gap when the numbering goes backwards or repeats", () => {
      expect(checkGap(createInciso("a", "III"), createInciso("b", "I"))).toBe(
        false,
      );
      expect(checkGap(createInciso("a", "II"), createInciso("b", "II"))).toBe(
        false,
      );
    });

    it("detects gaps between Alínea letters", () => {
      const prev = createElement("ali-a", "Alínea", "a", "inc-1");

      expect(
        checkGap(prev, createElement("ali-c", "Alínea", "c", "inc-1")),
      ).toBe(true);
      expect(
        checkGap(prev, createElement("ali-b", "Alínea", "b", "inc-1")),
      ).toBe(false);
    });

    it("returns false when either index cannot be resolved to a number", () => {
      expect(checkGap(createInciso("a", "I"), createInciso("b", ""))).toBe(
        false,
      );
      expect(
        checkGap(
          createElement("cap-1", "Capítulo", "I"),
          createElement("cap-3", "Capítulo", "III"),
        ),
      ).toBe(false);
    });

    it("detects gaps between hierarchical siblings on the same branch", () => {
      expect(checkGap(createInciso("a", "2.1"), createInciso("b", "2.4"))).toBe(
        true,
      );
      expect(
        checkGap(createInciso("a", "2.1."), createInciso("b", "2.2.")),
      ).toBe(false);
    });

    it("does not compare hierarchical indexes from different branches", () => {
      expect(checkGap(createInciso("a", "1.1"), createInciso("b", "2.1"))).toBe(
        false,
      );
      expect(
        checkGap(createInciso("a", "1.1.1"), createInciso("b", "1.2.5")),
      ).toBe(false);
    });

    it("does not report a gap when hierarchical numbering goes backwards", () => {
      expect(checkGap(createInciso("a", "1.5"), createInciso("b", "1.2"))).toBe(
        false,
      );
    });

    it("bails out when only one of the indexes is hierarchical", () => {
      // Without this guard '1.1' would be read as 11 and compared against 3.
      expect(checkGap(createInciso("a", "1.1"), createInciso("b", "3"))).toBe(
        false,
      );
      expect(checkGap(createInciso("a", "3"), createInciso("b", "1.1"))).toBe(
        false,
      );
    });
  });

  describe("processGaps", () => {
    it("returns an empty list for an empty input", () => {
      expect(processGaps([])).toEqual([]);
    });

    it("returns a single element untouched", () => {
      const el = createInciso("inc-5", "V");
      const result = processGaps([el]);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(el);
    });

    it("inserts the gap marker before the element that jumps", () => {
      const first = createInciso("inc-1", "I");
      const third = createInciso("inc-3", "III");

      const result = processGaps([first, third]);

      expect(itemIds(result)).toEqual([
        "inc-1",
        "gap-seq-inc-1-inc-3",
        "inc-3",
      ]);
      expect(result[0]).toBe(first);
      expect(result[2]).toBe(third);
    });

    it("tracks the last element of each type independently in a deep hierarchy", () => {
      const elements = [
        createElement("cap-1", "Capítulo", "I"),
        createElement("art-1", "Artigo", "1º", "cap-1"),
        createElement("inc-1", "Inciso", "I", "art-1"),
        createElement("ali-a", "Alínea", "a", "inc-1"),
        createElement("ali-c", "Alínea", "c", "inc-1"),
        createElement("inc-3", "Inciso", "III", "art-1"),
        createElement("art-3", "Artigo", "3º", "cap-1"),
        createElement("cap-3", "Capítulo", "III"),
      ];

      const result = processGaps(elements);

      expect(itemIds(result)).toEqual([
        "cap-1",
        "art-1",
        "inc-1",
        "ali-a",
        "gap-seq-ali-a-ali-c",
        "ali-c",
        "gap-seq-inc-1-inc-3",
        "inc-3",
        "gap-seq-art-1-art-3",
        "art-3",
        // Capítulo indexes are roman but only Inciso gets roman parsing,
        // so the jump from I to III is invisible here.
        "cap-3",
      ]);
    });

    it("keeps tracking the latest element of a type even across parents", () => {
      const result = processGaps([
        createInciso("a-inc-1", "I", "art-1"),
        createInciso("b-inc-1", "I", "art-2"),
        createInciso("b-inc-3", "III", "art-2"),
      ]);

      expect(gapIds(result)).toEqual(["gap-seq-b-inc-1-b-inc-3"]);
    });

    it("does not compare elements of different types even when interleaved", () => {
      const result = processGaps([
        createElement("art-1", "Artigo", "1º", "cap-1"),
        createElement("inc-1", "Inciso", "I", "art-1"),
        createElement("art-2", "Artigo", "2º", "cap-1"),
        createElement("inc-2", "Inciso", "II", "art-2"),
      ]);

      expect(gapIds(result)).toEqual([]);
      expect(result).toHaveLength(4);
    });

    it("is not idempotent: re-processing its own output duplicates gap markers", () => {
      const elements = [
        createInciso("inc-1", "I"),
        createInciso("inc-3", "III"),
      ];

      const once = processGaps(elements);
      const twice = processGaps(once as unknown as NormativeElementEntity[]);

      expect(gapIds(once)).toHaveLength(1);
      expect(gapIds(twice)).toHaveLength(2);
      expect(itemIds(twice)).toEqual([
        "inc-1",
        "gap-seq-inc-1-inc-3",
        "gap-seq-inc-1-inc-3",
        "inc-3",
      ]);
    });
  });

  describe("processGapsUnified", () => {
    const fullNorm = () => [
      createElement("cap-1", "Capítulo", "I"),
      createElement("art-1", "Artigo", "1º", "cap-1"),
      createElement("inc-1", "Inciso", "I", "art-1"),
      createElement("ali-a", "Alínea", "a", "inc-1"),
      createElement("art-2", "Artigo", "2º", "cap-1"),
    ];

    it("returns the very same array when the selection is empty", () => {
      const selected: NormativeElementEntity[] = [];

      expect(processGapsUnified(selected, fullNorm())).toBe(selected);
    });

    it("returns the selection untouched when the full norm is empty", () => {
      const selected = [createElement("art-1", "Artigo", "1º")];

      expect(processGapsUnified(selected, [])).toBe(selected);
    });

    it("returns the selection untouched when no selected id exists in the full norm", () => {
      const selected = [createElement("unknown", "Artigo", "9º")];

      expect(processGapsUnified(selected, fullNorm())).toBe(selected);
    });

    it("adds no markers when the selection covers the whole norm", () => {
      const full = fullNorm();

      const result = processGapsUnified(full, full);

      expect(result).toEqual(full);
      expect(gapIds(result)).toEqual([]);
    });

    it("handles a single-element selection in the middle of the norm", () => {
      const full = fullNorm();

      const result = processGapsUnified([full[2]], full);

      expect(itemIds(result)).toEqual(["gap-start", "inc-1", "gap-end"]);
    });

    it("adds only a trailing marker when the selection starts at the first element", () => {
      const full = fullNorm();

      const result = processGapsUnified([full[0], full[1]], full);

      expect(itemIds(result)).toEqual(["cap-1", "art-1", "gap-end"]);
    });

    it("adds only a leading marker when the selection ends at the last element", () => {
      const full = fullNorm();

      const result = processGapsUnified([full[3], full[4]], full);

      expect(itemIds(result)).toEqual(["gap-start", "ali-a", "art-2"]);
    });

    it("names in-between markers after the element that precedes the hole", () => {
      const full = fullNorm();

      const result = processGapsUnified([full[0], full[2], full[4]], full);

      expect(itemIds(result)).toEqual([
        "cap-1",
        "gap-between-cap-1",
        "inc-1",
        "gap-between-inc-1",
        "art-2",
      ]);
    });

    it("returns the elements coming from the full norm, not the selected copies", () => {
      const full = fullNorm();
      const selectedCopies = [{ ...full[1] }, { ...full[3] }];

      const result = processGapsUnified(selectedCopies, full);

      expect(result[1]).toBe(full[1]);
      expect(result[3]).toBe(full[3]);
      expect(result[1]).not.toBe(selectedCopies[0]);
    });

    it("reorders an out-of-order selection by document position", () => {
      const full = fullNorm();

      const result = processGapsUnified([full[3], full[0]], full);

      expect(itemIds(result)).toEqual([
        "cap-1",
        "gap-between-cap-1",
        "ali-a",
        "gap-end",
      ]);
    });

    it("repeats an element that appears twice in the selection without adding a gap between the copies", () => {
      const full = fullNorm();

      const result = processGapsUnified([full[1], full[1]], full);

      expect(itemIds(result)).toEqual([
        "gap-start",
        "art-1",
        "art-1",
        "gap-end",
      ]);
    });

    it("is idempotent because previously inserted markers are not found in the full norm", () => {
      const full = fullNorm();

      const once = processGapsUnified([full[1], full[3]], full);
      const twice = processGapsUnified(
        once as unknown as NormativeElementEntity[],
        full,
      );

      expect(itemIds(once)).toEqual([
        "gap-start",
        "art-1",
        "gap-between-art-1",
        "ali-a",
        "gap-end",
      ]);
      expect(twice).toEqual(once);
    });
  });
});
