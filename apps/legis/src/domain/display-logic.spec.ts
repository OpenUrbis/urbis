import { describe, expect, it } from "vitest";
import { getElementKey } from "./display-logic";

describe("display-logic", () => {
  it("should render hierarchical numeric inciso indexes without adding a dash separator", () => {
    const key = getElementKey({
      type: "Inciso",
      index: "8.1.2.",
      text: "",
    } as any);

    expect(key).toBe("8.1.2. ");
  });

  it("should preserve dot separator for roman numeral incisos when present in text", () => {
    const key = getElementKey({
      type: "Inciso",
      index: "I",
      text: "I. identificação...",
    } as any);

    expect(key).toBe("I. ");
  });

  it("should preserve dash separator for roman numeral incisos", () => {
    const key = getElementKey({
      type: "Inciso",
      index: "I",
      text: "",
    } as any);

    expect(key).toBe("I - ");
  });

  it("should preserve dot separator for items when present in text", () => {
    const key = getElementKey({
      type: "Item",
      index: "1",
      text: "1. detalhamento complementar...",
    } as any);

    expect(key).toBe("1. ");
  });

  it("should preserve dash separator for items when present in text", () => {
    const key = getElementKey({
      type: "Item",
      index: "1",
      text: "1 - detalhamento complementar...",
    } as any);

    expect(key).toBe("1 - ");
  });

  it("should not infer dash from HTML attributes for hierarchical numeric items", () => {
    const key = getElementKey({
      type: "Item",
      index: "2.1.",
      text: '<span class="font-medium" style="color: rgb(0, 0, 0);"><strong>2.1.</strong> A implantação de qualquer edificação no lote deve atender às disposições previstas no PDE e LPUOS.</span>',
    } as any);

    expect(key).toBe("2.1. ");
  });

  it("should render alphanumeric hierarchical item indexes without adding a dash separator", () => {
    const key = getElementKey({
      type: "Item",
      index: "3.A.1.",
      text: "",
    } as any);

    expect(key).toBe("3.A.1. ");
  });

  it("should preserve dot separator for alíneas when present in text", () => {
    const key = getElementKey({
      type: "Alínea",
      index: "a",
      text: "a. coordenadas...",
    } as any);

    expect(key).toBe("a. ");
  });
});
