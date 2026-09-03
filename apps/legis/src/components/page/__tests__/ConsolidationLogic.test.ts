import { describe, it, expect } from "vitest";
import {
  isElementInactive,
  processElementsForConsolidated,
} from "../ConsolidationLogic";
import {
  NormativeElementEntity,
  SpecialSituation,
} from "../../../domain/entities";

// Helper
const createElement = (
  id: string,
  situations: SpecialSituation[] = [],
  type: string = "Artigo",
  text: string = "Text",
): NormativeElementEntity => ({
  id,
  type: type as any,
  index: "1",
  text,
  specialSituations: situations,
  originalStartValidity: { date: "01.01.2020", deviceId: "Lei 1" },
});

describe("ConsolidationLogic", () => {
  describe("isElementInactive", () => {
    it("should be active by default", () => {
      const el = createElement("1");
      expect(isElementInactive(el)).toBe(false);
    });

    it("should be inactive if Revoked", () => {
      const el = createElement("1", [
        { type: "Revogação", date: "01.01.2021" },
      ]);
      expect(isElementInactive(el)).toBe(true);
    });

    it("should be inactive if Vetoed", () => {
      const el = createElement("1", [{ type: "Veto", date: "01.01.2021" }]);
      expect(isElementInactive(el)).toBe(true);
    });

    it("should be active if Veto is overturned (Derrubada is latest)", () => {
      const el = createElement("1", [
        { type: "Veto", date: "01.01.2021" },
        { type: "Derrubada de veto", date: "01.02.2021" },
      ]);
      expect(isElementInactive(el)).toBe(false);
    });

    it("should be active if Revoked then Repristinated", () => {
      const el = createElement("1", [
        { type: "Revogação", date: "01.01.2021" },
        { type: "Repristinação", date: "01.02.2021" },
      ]);
      expect(isElementInactive(el)).toBe(false);
    });
  });

  describe("processElementsForConsolidated", () => {
    it("should filter inactive elements and replace with separator", () => {
      const elements = [
        createElement("1"), // Active
        createElement("2", [{ type: "Revogação", date: "01.01.2021" }]), // Inactive
        createElement("3"), // Active
      ];

      const result = processElementsForConsolidated(elements);

      // Expected: 1, Separator, 3
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe("1");
      expect(result[1].type).toBe("Separator");
      expect(result[2].id).toBe("3");
    });

    it("should group consecutive inactive elements into one separator", () => {
      const elements = [
        createElement("1"),
        createElement("2", [{ type: "Revogação", date: "01.01.2021" }]),
        createElement("3", [{ type: "Veto", date: "01.01.2021" }]),
        createElement("4"),
      ];

      const result = processElementsForConsolidated(elements);

      // Expected: 1, Separator, 4
      expect(result).toHaveLength(3);
      expect(result[1].type).toBe("Separator");
    });
  });
});
