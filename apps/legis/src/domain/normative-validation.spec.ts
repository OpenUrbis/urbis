import { describe, expect, it } from "vitest";

import { validateElement } from "./normative-validation";

describe("normative-validation", () => {
  it("should not warn about trailing punctuation for hierarchical alphanumeric item indexes", () => {
    const issues = validateElement({
      id: "item-3-a",
      type: "Item",
      index: "3.A.",
      text: "A descaracterização da APP deverá ser comprovada pelo interessado.",
      originalStartValidity: { date: "", deviceId: "" },
      specialSituations: [],
    } as any);

    expect(issues).not.toContainEqual(
      expect.objectContaining({
        message:
          "Não é necessário incluir espaços ou pontuação ao final do item",
      }),
    );
  });
});
