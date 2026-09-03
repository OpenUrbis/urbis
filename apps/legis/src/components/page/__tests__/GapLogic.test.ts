import { describe, expect, it } from "vitest";
import { processGaps } from "../GapLogic";

describe("GapLogic", () => {
  const createElement = (id: string, index: string, text = "") =>
    ({
      id,
      type: "Inciso",
      index,
      text,
      parentId: "anexo-1",
      originalStartValidity: { date: "", deviceId: "" },
      specialSituations: [],
    }) as any;

  it("should not insert synthetic gaps when moving from a hierarchical item to its child level", () => {
    const result = processGaps([
      createElement("inc-1-1", "1.1."),
      createElement("inc-1-1-1", "1.1.1."),
    ]);

    expect(result).toHaveLength(2);
    expect(result.some((item) => item.type === "Gap")).toBe(false);
  });

  it("should not insert synthetic gaps when moving back from a child level to the next sibling branch", () => {
    const result = processGaps([
      createElement("inc-1-1-1", "1.1.1."),
      createElement("inc-1-2", "1.2."),
    ]);

    expect(result).toHaveLength(2);
    expect(result.some((item) => item.type === "Gap")).toBe(false);
  });

  it("should still detect real gaps between hierarchical sibling indexes", () => {
    const result = processGaps([
      createElement("inc-1-1-1", "1.1.1."),
      createElement("inc-1-1-3", "1.1.3."),
    ]);

    expect(result).toHaveLength(3);
    expect(result[1]).toMatchObject({ type: "Gap" });
  });
});
