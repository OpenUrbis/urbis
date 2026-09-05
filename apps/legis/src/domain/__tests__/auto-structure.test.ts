import { describe, expect, it } from "vitest";

import type { ElementType } from "../entities";
import { RulesEngine } from "../rules-engine";
import {
  autoMergeStructuralHeaders,
  getFirstAutoStructureLine,
  getImmediateHierarchicalParentIndex,
  isHierarchicalNumericIndex,
  normalizeHierarchicalNumericIndex,
  registerHierarchicalNumericParent,
  resolveHierarchicalNumericParentId,
  shouldClearHierarchicalNumericParents,
} from "../auto-structure";

describe("isHierarchicalNumericIndex", () => {
  it("rejects missing, empty and whitespace-only indexes", () => {
    expect(isHierarchicalNumericIndex()).toBe(false);
    expect(isHierarchicalNumericIndex(undefined)).toBe(false);
    expect(isHierarchicalNumericIndex("")).toBe(false);
    expect(isHierarchicalNumericIndex("   ")).toBe(false);
    expect(isHierarchicalNumericIndex("\n\t")).toBe(false);
  });

  it("trims surrounding whitespace before matching", () => {
    expect(isHierarchicalNumericIndex(" 1.1 ")).toBe(true);
    expect(isHierarchicalNumericIndex("\t2.3.4.\n")).toBe(true);
  });

  it("requires at least two numeric segments", () => {
    expect(isHierarchicalNumericIndex("1")).toBe(false);
    expect(isHierarchicalNumericIndex("1.")).toBe(false);
    expect(isHierarchicalNumericIndex("10")).toBe(false);
    expect(isHierarchicalNumericIndex("1.2.3.4.5")).toBe(true);
  });

  it("accepts zero padded segments and a single trailing dot", () => {
    expect(isHierarchicalNumericIndex("01.02")).toBe(true);
    expect(isHierarchicalNumericIndex("1.1.")).toBe(true);
    expect(isHierarchicalNumericIndex("1.1..")).toBe(false);
  });

  it("rejects letters, roman numerals, ordinal signs and inner blanks", () => {
    expect(isHierarchicalNumericIndex("1.A")).toBe(false);
    expect(isHierarchicalNumericIndex("1.1.a")).toBe(false);
    expect(isHierarchicalNumericIndex("I.1")).toBe(false);
    expect(isHierarchicalNumericIndex("1º.1")).toBe(false);
    expect(isHierarchicalNumericIndex("1 . 1")).toBe(false);
    expect(isHierarchicalNumericIndex("1..2")).toBe(false);
  });
});

describe("getFirstAutoStructureLine", () => {
  it("keeps a following item from being absorbed into the current index", () => {
    const engine = new RulesEngine();
    const indexedParents = new Map<string, string>();
    const parentLine = "1.1.\n1.1.1.";

    const parent = engine.parseLine(getFirstAutoStructureLine(parentLine));
    registerHierarchicalNumericParent(
      indexedParents,
      parent.type,
      parent.index,
      "item-1-1",
    );

    const child = engine.parseLine(
      getFirstAutoStructureLine("1.1.1.\nDescrição do item."),
    );

    expect(parent).toMatchObject({ type: "Item", index: "1.1" });
    expect(child).toMatchObject({ type: "Item", index: "1.1.1" });
    expect(
      resolveHierarchicalNumericParentId(
        child.type,
        child.index,
        indexedParents,
      ),
    ).toBe("item-1-1");
  });

  it("skips blank lines without changing the parsed key", () => {
    expect(getFirstAutoStructureLine("\n\r\n  2.1. item")).toBe(
      "  2.1. item",
    );
  });
});

describe("normalizeHierarchicalNumericIndex", () => {
  it("drops the trailing dot and inner blanks", () => {
    expect(normalizeHierarchicalNumericIndex("1.1.")).toBe("1.1");
    expect(normalizeHierarchicalNumericIndex(" 2 . 3 ")).toBe("2.3");
    expect(normalizeHierarchicalNumericIndex("4.5.6")).toBe("4.5.6");
  });

  it("returns undefined for missing, blank and single segment indexes", () => {
    expect(normalizeHierarchicalNumericIndex()).toBeUndefined();
    expect(normalizeHierarchicalNumericIndex("")).toBeUndefined();
    expect(normalizeHierarchicalNumericIndex("   ")).toBeUndefined();
    expect(normalizeHierarchicalNumericIndex(".")).toBeUndefined();
    expect(normalizeHierarchicalNumericIndex("1")).toBeUndefined();
    expect(normalizeHierarchicalNumericIndex("1.")).toBeUndefined();
  });

  it("returns undefined when any segment is not numeric", () => {
    expect(normalizeHierarchicalNumericIndex("1.a")).toBeUndefined();
    expect(normalizeHierarchicalNumericIndex("I.II")).toBeUndefined();
    expect(normalizeHierarchicalNumericIndex("1º.2")).toBeUndefined();
  });

  it("rejects an index that crosses a line break", () => {
    expect(normalizeHierarchicalNumericIndex("1.1.\n1.1.1.")).toBeUndefined();
  });

  it("silently collapses empty segments, unlike isHierarchicalNumericIndex", () => {
    expect(normalizeHierarchicalNumericIndex("1..2")).toBe("1.2");
    expect(normalizeHierarchicalNumericIndex(".1.2.")).toBe("1.2");
    expect(isHierarchicalNumericIndex("1..2")).toBe(false);
  });
});

describe("getImmediateHierarchicalParentIndex", () => {
  it("uppercases alphanumeric segments while dropping the trailing dot", () => {
    expect(getImmediateHierarchicalParentIndex("3.a.")).toBe("3");
    expect(getImmediateHierarchicalParentIndex("3.a.1.")).toBe("3.A");
    expect(getImmediateHierarchicalParentIndex("8.b.c")).toBe("8.B");
  });

  it("returns undefined when there is no parent segment", () => {
    expect(getImmediateHierarchicalParentIndex()).toBeUndefined();
    expect(getImmediateHierarchicalParentIndex("")).toBeUndefined();
    expect(getImmediateHierarchicalParentIndex("   ")).toBeUndefined();
    expect(getImmediateHierarchicalParentIndex("1")).toBeUndefined();
    expect(getImmediateHierarchicalParentIndex("1.")).toBeUndefined();
    expect(getImmediateHierarchicalParentIndex(".5.")).toBeUndefined();
  });

  it("tolerates blanks and repeated dots around the segments", () => {
    expect(getImmediateHierarchicalParentIndex("1 . 1 . 2")).toBe("1.1");
    expect(getImmediateHierarchicalParentIndex("1..2")).toBe("1");
  });
});

describe("shouldClearHierarchicalNumericParents", () => {
  it("clears the ancestry for every structural scope breaker", () => {
    const breakers: ElementType[] = [
      "Parte",
      "Livro",
      "Título",
      "Capítulo",
      "Seção",
      "Subseção",
      "Anexo",
    ];

    for (const type of breakers) {
      expect(shouldClearHierarchicalNumericParents(type)).toBe(true);
    }
  });

  it("keeps the ancestry for list level and content types", () => {
    const keepers: ElementType[] = [
      "Alínea",
      "Divisão desconforme",
      "Elemento desconforme",
      "Tabela",
      "Figura",
      "Mapa",
      "Nota",
      "Texto",
    ];

    for (const type of keepers) {
      expect(shouldClearHierarchicalNumericParents(type)).toBe(false);
    }
  });
});

describe("registerHierarchicalNumericParent", () => {
  it("ignores missing and whitespace-only indexes", () => {
    const indexedParents = new Map<string, string>();

    registerHierarchicalNumericParent(
      indexedParents,
      "Item",
      undefined,
      "item-sem-indice",
    );
    registerHierarchicalNumericParent(
      indexedParents,
      "Item",
      "   ",
      "item-branco",
    );
    registerHierarchicalNumericParent(
      indexedParents,
      "Inciso",
      undefined,
      "inciso-sem-indice",
    );
    registerHierarchicalNumericParent(
      indexedParents,
      "Inciso",
      " ",
      "inciso-branco",
    );

    expect(indexedParents.size).toBe(0);
  });

  it("only registers incisos whose index is hierarchical numeric", () => {
    const indexedParents = new Map<string, string>();

    registerHierarchicalNumericParent(
      indexedParents,
      "Inciso",
      "I",
      "inciso-i",
    );
    registerHierarchicalNumericParent(
      indexedParents,
      "Inciso",
      "1",
      "inciso-1",
    );
    registerHierarchicalNumericParent(
      indexedParents,
      "Inciso",
      "1.A.",
      "inciso-1-a",
    );
    registerHierarchicalNumericParent(
      indexedParents,
      "Inciso",
      "1..2",
      "inciso-1-2",
    );

    expect(indexedParents.size).toBe(0);

    registerHierarchicalNumericParent(
      indexedParents,
      "Inciso",
      " 1.2. ",
      "inciso-1-2",
    );

    expect(Array.from(indexedParents.entries())).toEqual([
      ["Inciso:1.2", "inciso-1-2"],
    ]);
  });

  it("ignores types other than Item and Inciso", () => {
    const indexedParents = new Map<string, string>();

    registerHierarchicalNumericParent(
      indexedParents,
      "Artigo",
      "1",
      "artigo-1",
    );
    registerHierarchicalNumericParent(
      indexedParents,
      "Parágrafo",
      "1.1.",
      "paragrafo-1-1",
    );
    registerHierarchicalNumericParent(
      indexedParents,
      "Alínea",
      "a",
      "alinea-a",
    );
    registerHierarchicalNumericParent(
      indexedParents,
      "Texto",
      "1.1.",
      "texto-1-1",
    );

    expect(indexedParents.size).toBe(0);
  });

  it("registers item indexes in a case insensitive, trimmed form", () => {
    const indexedParents = new Map<string, string>();

    registerHierarchicalNumericParent(
      indexedParents,
      "Item",
      " 3.a. ",
      "item-3-a",
    );

    expect(Array.from(indexedParents.keys())).toEqual(["Item:3.A"]);
    expect(
      resolveHierarchicalNumericParentId("Item", "3.a.1.", indexedParents),
    ).toBe("item-3-a");
    expect(
      resolveHierarchicalNumericParentId("Item", "3.A.1.", indexedParents),
    ).toBe("item-3-a");
  });

  it("registers non dotted item indexes as branch roots", () => {
    const indexedParents = new Map<string, string>();

    registerHierarchicalNumericParent(indexedParents, "Item", "a", "item-a");

    expect(Array.from(indexedParents.entries())).toEqual([
      ["Item:A", "item-a"],
    ]);
  });

  it("reaches the same state when the registrations of a branch are replayed", () => {
    const indexedParents = new Map<string, string>();

    registerHierarchicalNumericParent(indexedParents, "Item", "1", "item-1");
    registerHierarchicalNumericParent(
      indexedParents,
      "Item",
      "1.1.",
      "item-1-1",
    );
    registerHierarchicalNumericParent(indexedParents, "Item", "1", "item-1");
    registerHierarchicalNumericParent(
      indexedParents,
      "Item",
      "1.1.",
      "item-1-1",
    );

    expect(Array.from(indexedParents.entries())).toEqual([
      ["Item:1", "item-1"],
      ["Item:1.1", "item-1-1"],
    ]);
    expect(
      resolveHierarchicalNumericParentId("Item", "1.1.1.", indexedParents),
    ).toBe("item-1-1");
  });

  it("overwrites the id when the same index is reused by another element", () => {
    const indexedParents = new Map<string, string>();

    registerHierarchicalNumericParent(indexedParents, "Item", "1", "item-1");
    registerHierarchicalNumericParent(
      indexedParents,
      "Item",
      "1",
      "item-1-bis",
    );

    expect(Array.from(indexedParents.entries())).toEqual([
      ["Item:1", "item-1-bis"],
    ]);
  });

  it("prunes the deeper branch when an ancestor item is registered again", () => {
    const indexedParents = new Map<string, string>();

    registerHierarchicalNumericParent(indexedParents, "Item", "1", "item-1");
    registerHierarchicalNumericParent(
      indexedParents,
      "Item",
      "1.4.",
      "item-1-4",
    );
    registerHierarchicalNumericParent(indexedParents, "Item", "1", "item-1");

    expect(Array.from(indexedParents.keys())).toEqual(["Item:1"]);
    expect(
      resolveHierarchicalNumericParentId("Item", "1.4.1.", indexedParents),
    ).toBeUndefined();
  });

  it("prunes only the inciso branch when a new inciso branch starts", () => {
    const indexedParents = new Map<string, string>();

    registerHierarchicalNumericParent(indexedParents, "Item", "1", "item-1");
    registerHierarchicalNumericParent(
      indexedParents,
      "Inciso",
      "1.1.",
      "inciso-1-1",
    );
    registerHierarchicalNumericParent(
      indexedParents,
      "Inciso",
      "2.1.",
      "inciso-2-1",
    );

    expect(Array.from(indexedParents.keys())).toEqual(["Item:1", "Inciso:2.1"]);
    expect(
      resolveHierarchicalNumericParentId("Inciso", "1.1.1.", indexedParents),
    ).toBeUndefined();
    expect(
      resolveHierarchicalNumericParentId("Inciso", "1.1.", indexedParents),
    ).toBe("item-1");
  });

  it("keeps sibling ancestors of the newly registered branch", () => {
    const indexedParents = new Map<string, string>();

    registerHierarchicalNumericParent(indexedParents, "Item", "1", "item-1");
    registerHierarchicalNumericParent(
      indexedParents,
      "Item",
      "1.2.",
      "item-1-2",
    );
    registerHierarchicalNumericParent(
      indexedParents,
      "Item",
      "1.2.3.",
      "item-1-2-3",
    );

    expect(Array.from(indexedParents.keys())).toEqual([
      "Item:1",
      "Item:1.2",
      "Item:1.2.3",
    ]);
  });
});

describe("resolveHierarchicalNumericParentId", () => {
  const populated = () => {
    const indexedParents = new Map<string, string>();

    registerHierarchicalNumericParent(indexedParents, "Item", "1", "item-1");
    registerHierarchicalNumericParent(
      indexedParents,
      "Item",
      "1.1.",
      "item-1-1",
    );

    return indexedParents;
  };

  it("returns undefined for types that do not take hierarchical parents", () => {
    const indexedParents = populated();
    const types: ElementType[] = [
      "Artigo",
      "Parágrafo",
      "Alínea",
      "Capítulo",
      "Texto",
    ];

    for (const type of types) {
      expect(
        resolveHierarchicalNumericParentId(type, "1.1.", indexedParents),
      ).toBeUndefined();
    }
  });

  it("returns undefined when the child index is not hierarchical", () => {
    const indexedParents = populated();

    expect(
      resolveHierarchicalNumericParentId("Item", undefined, indexedParents),
    ).toBeUndefined();
    expect(
      resolveHierarchicalNumericParentId("Item", "", indexedParents),
    ).toBeUndefined();
    expect(
      resolveHierarchicalNumericParentId("Item", "3", indexedParents),
    ).toBeUndefined();
    expect(
      resolveHierarchicalNumericParentId("Inciso", "IV", indexedParents),
    ).toBeUndefined();
    expect(
      resolveHierarchicalNumericParentId("Inciso", "1.a.", indexedParents),
    ).toBeUndefined();
    expect(
      resolveHierarchicalNumericParentId("Item", "1..2", indexedParents),
    ).toBeUndefined();
  });

  it("returns undefined when nothing was registered yet", () => {
    const indexedParents = new Map<string, string>();

    expect(
      resolveHierarchicalNumericParentId("Item", "1.1.", indexedParents),
    ).toBeUndefined();
    expect(
      resolveHierarchicalNumericParentId("Inciso", "1.1.", indexedParents),
    ).toBeUndefined();
  });

  it("never resolves an item child from an inciso ancestor", () => {
    const indexedParents = new Map<string, string>();

    registerHierarchicalNumericParent(
      indexedParents,
      "Inciso",
      "1.1.",
      "inciso-1-1",
    );

    expect(
      resolveHierarchicalNumericParentId("Item", "1.1.1.", indexedParents),
    ).toBeUndefined();
  });

  it("prefers the inciso ancestor over the item one for inciso children", () => {
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
      resolveHierarchicalNumericParentId("Inciso", "8.2.1.", indexedParents),
    ).toBe("inciso-8-2");
  });

  it("tolerates blanks and casing in the child index", () => {
    const indexedParents = new Map<string, string>();

    registerHierarchicalNumericParent(indexedParents, "Item", "4", "item-4");

    expect(
      resolveHierarchicalNumericParentId("Item", " 4.b. ", indexedParents),
    ).toBe("item-4");
    expect(
      resolveHierarchicalNumericParentId("Inciso", " 4.1. ", indexedParents),
    ).toBe("item-4");
  });

  it("walks a full item/inciso branch registered step by step", () => {
    const indexedParents = new Map<string, string>();
    const branch: Array<[ElementType, string, string]> = [
      ["Item", "2", "item-2"],
      ["Item", "2.1.", "item-2-1"],
      ["Inciso", "2.1.1.", "inciso-2-1-1"],
      ["Inciso", "2.1.1.1.", "inciso-2-1-1-1"],
    ];

    const resolved = branch.map(([type, index, id]) => {
      const parentId = resolveHierarchicalNumericParentId(
        type,
        index,
        indexedParents,
      );
      registerHierarchicalNumericParent(indexedParents, type, index, id);

      return parentId;
    });

    expect(resolved).toEqual([undefined, "item-2", "item-2-1", "inciso-2-1-1"]);
  });
});

describe("autoMergeStructuralHeaders", () => {
  const engine = new RulesEngine();

  it("merges standalone structural headers with their subsequent rubric paragraph", () => {
    const content = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          attrs: { normativeId: "tit-1" },
          content: [{ type: "text", text: "TÍTULO I" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "DA ABRANGÊNCIA, DOS CONCEITOS, PRINCÍPIOS E OBJETIVOS",
            },
          ],
        },
        {
          type: "paragraph",
          attrs: { normativeId: "cap-1" },
          content: [{ type: "text", text: "CAPÍTULO I" }],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "DOS PRINCÍPIOS E OBJETIVOS" },
          ],
        },
        {
          type: "paragraph",
          attrs: { normativeId: "art-1" },
          content: [
            {
              type: "text",
              text: "Art. 1º Esta lei disciplina o parcelamento do solo.",
            },
          ],
        },
      ],
    };

    const { nextContent, changed } = autoMergeStructuralHeaders(content, engine);

    expect(changed).toBe(true);
    expect(nextContent?.content).toHaveLength(3);

    // First block: TÍTULO I with hardBreak and rubric
    expect(nextContent?.content?.[0]).toEqual({
      type: "paragraph",
      attrs: { normativeId: "tit-1" },
      content: [
        { type: "text", text: "TÍTULO I" },
        { type: "hardBreak" },
        {
          type: "text",
          text: "DA ABRANGÊNCIA, DOS CONCEITOS, PRINCÍPIOS E OBJETIVOS",
        },
      ],
    });

    // Second block: CAPÍTULO I with hardBreak and rubric
    expect(nextContent?.content?.[1]).toEqual({
      type: "paragraph",
      attrs: { normativeId: "cap-1" },
      content: [
        { type: "text", text: "CAPÍTULO I" },
        { type: "hardBreak" },
        { type: "text", text: "DOS PRINCÍPIOS E OBJETIVOS" },
      ],
    });

    // Third block: Art. 1º untouched
    expect(nextContent?.content?.[2]).toEqual({
      type: "paragraph",
      attrs: { normativeId: "art-1" },
      content: [
        {
          type: "text",
          text: "Art. 1º Esta lei disciplina o parcelamento do solo.",
        },
      ],
    });
  });

  it("does not merge when header already contains its rubric in the same block", () => {
    const content = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "CAPÍTULO I - DOS PRINCÍPIOS E OBJETIVOS",
            },
          ],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Art. 1º Esta lei disciplina o uso do solo.",
            },
          ],
        },
      ],
    };

    const { nextContent, changed } = autoMergeStructuralHeaders(content, engine);
    expect(changed).toBe(false);
    expect(nextContent?.content).toHaveLength(2);
  });

  it("does not merge when standalone header is followed by another structural element", () => {
    const content = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "TÍTULO I" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "CAPÍTULO I" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Art. 1º Disposições gerais.",
            },
          ],
        },
      ],
    };

    const { nextContent, changed } = autoMergeStructuralHeaders(content, engine);
    expect(changed).toBe(false);
    expect(nextContent?.content).toHaveLength(3);
  });
});
