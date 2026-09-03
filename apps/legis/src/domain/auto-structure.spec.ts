import { describe, expect, it } from "vitest";

import {
  getImmediateHierarchicalParentIndex,
  isHierarchicalNumericIndex,
  registerHierarchicalNumericParent,
  resolveHierarchicalNumericParentId,
  shouldClearHierarchicalNumericParents,
} from "./auto-structure";

describe("auto-structure helpers", () => {
  it("should detect hierarchical numeric indexes and compute their immediate parent index", () => {
    expect(isHierarchicalNumericIndex("1.1.")).toBe(true);
    expect(isHierarchicalNumericIndex("1")).toBe(false);
    expect(getImmediateHierarchicalParentIndex("1.1.")).toBe("1");
    expect(getImmediateHierarchicalParentIndex("1.1.1.")).toBe("1.1");
  });

  it("should resolve hierarchical inciso parents from previously indexed numeric elements", () => {
    const indexedParents = new Map<string, string>();

    registerHierarchicalNumericParent(indexedParents, "Item", "1", "item-1");

    expect(
      resolveHierarchicalNumericParentId("Inciso", "1.1.", indexedParents),
    ).toBe("item-1");

    registerHierarchicalNumericParent(
      indexedParents,
      "Inciso",
      "1.1.",
      "inciso-1-1",
    );

    expect(
      resolveHierarchicalNumericParentId("Inciso", "1.1.1.", indexedParents),
    ).toBe("inciso-1-1");
  });

  it("should resolve hierarchical item parents only from the immediate dotted item ancestry", () => {
    const indexedParents = new Map<string, string>();

    registerHierarchicalNumericParent(
      indexedParents,
      "Item",
      "8.2.",
      "item-8-2",
    );
    registerHierarchicalNumericParent(
      indexedParents,
      "Inciso",
      "8.2.",
      "inciso-8-2",
    );

    expect(
      resolveHierarchicalNumericParentId("Item", "8.2.1.", indexedParents),
    ).toBe("item-8-2");
  });

  it("should resolve hierarchical alphanumeric item parents from the immediate dotted item ancestry", () => {
    const indexedParents = new Map<string, string>();

    registerHierarchicalNumericParent(indexedParents, "Item", "3", "item-3");

    expect(
      resolveHierarchicalNumericParentId("Item", "3.A.", indexedParents),
    ).toBe("item-3");

    registerHierarchicalNumericParent(
      indexedParents,
      "Item",
      "3.A.",
      "item-3-a",
    );

    expect(
      resolveHierarchicalNumericParentId("Item", "3.A.1.", indexedParents),
    ).toBe("item-3-a");
  });

  it("should discard the previous numeric branch when a new root item starts", () => {
    const indexedParents = new Map<string, string>();

    registerHierarchicalNumericParent(indexedParents, "Item", "1", "item-1");
    registerHierarchicalNumericParent(
      indexedParents,
      "Item",
      "1.4.",
      "item-1-4",
    );
    registerHierarchicalNumericParent(
      indexedParents,
      "Inciso",
      "1.4.1.",
      "inciso-1-4-1",
    );

    registerHierarchicalNumericParent(indexedParents, "Item", "2", "item-2");

    expect(
      resolveHierarchicalNumericParentId("Item", "2.1.", indexedParents),
    ).toBe("item-2");
    expect(
      resolveHierarchicalNumericParentId("Item", "1.4.1.", indexedParents),
    ).toBeUndefined();
    expect(
      resolveHierarchicalNumericParentId("Inciso", "1.4.1.1.", indexedParents),
    ).toBeUndefined();
  });

  it("should only clear hierarchical numeric ancestry when entering a higher structural scope", () => {
    expect(shouldClearHierarchicalNumericParents("Artigo")).toBe(true);
    expect(shouldClearHierarchicalNumericParents("Parágrafo")).toBe(true);
    expect(shouldClearHierarchicalNumericParents("Inciso")).toBe(false);
    expect(shouldClearHierarchicalNumericParents("Item")).toBe(false);
  });
});
