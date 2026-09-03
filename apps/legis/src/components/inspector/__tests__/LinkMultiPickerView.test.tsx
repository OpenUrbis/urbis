import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type {
  CollectionLink,
  NormativeElementEntity,
  OriginalNormativo,
} from "../../../domain/entities";
import type { AnnotatedTextSegment } from "../../../domain/types";
import {
  LinkMultiPickerView,
  buildChildIndex,
  buildSelectedGroups,
  collectDescendants,
  collectSegmentDrafts,
  formatSelectionSummary,
  nextSelectionForElement,
  rebuildDocumentLinks,
  replaceElementSegments,
  selectedIdsForDocument,
  summarizeSelection,
  type ChildIndex,
  type LinkMultiPickerViewProps,
  type SegmentsLookup,
} from "../LinkMultiPickerView";

/* -------------------------------------------------------------------------- */
/* Fixtures                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Artigo > Inciso > Alínea. A alínea existe para provar que a máquina de 3
 * estados vale para qualquer tipo com filhos, e não só para a lista fechada
 * ['Artigo', 'Parágrafo', 'Inciso'] do gerenciador em modal.
 */
const ELEMENTS = [
  {
    id: "art-1",
    type: "Artigo",
    index: "1º",
    text: "Fica criado o programa municipal.",
  },
  {
    id: "inc-1",
    type: "Inciso",
    index: "I",
    text: "atendimento integral;",
    parentId: "art-1",
  },
  {
    id: "ali-a",
    type: "Alínea",
    index: "a",
    text: "em unidade própria;",
    parentId: "inc-1",
  },
  {
    id: "ali-b",
    type: "Alínea",
    index: "b",
    text: "em unidade conveniada;",
    parentId: "inc-1",
  },
] as unknown as NormativeElementEntity[];

function makeDocument(
  overrides: Partial<OriginalNormativo> = {},
): OriginalNormativo {
  return {
    id: "doc-1",
    type: "original_normativo",
    normativeType: "L",
    number: "1.234",
    authorityId: "auth-1",
    ementa: "Dispõe sobre o programa municipal.",
    elements: ELEMENTS,
    createdAt: "",
    updatedAt: "",
    ...overrides,
  } as OriginalNormativo;
}

const SEGMENTS: AnnotatedTextSegment[] = [
  { start: 0, end: 5, type: "omission", selectedText: "Fica " },
];

function makeLookup(
  drafts: Map<string, AnnotatedTextSegment[]>,
): SegmentsLookup {
  return (elementId) => drafts.get(elementId);
}

const NO_SEGMENTS: SegmentsLookup = () => undefined;

function indexFor(elements: NormativeElementEntity[] = ELEMENTS): ChildIndex {
  return buildChildIndex(elements);
}

/* -------------------------------------------------------------------------- */
/* Hierarchy                                                                   */
/* -------------------------------------------------------------------------- */

describe("buildChildIndex / collectDescendants", () => {
  it("collects every descendant, at any depth", () => {
    const index = indexFor();

    expect(collectDescendants(index, "art-1").sort()).toEqual([
      "ali-a",
      "ali-b",
      "inc-1",
    ]);
    expect(collectDescendants(index, "inc-1").sort()).toEqual([
      "ali-a",
      "ali-b",
    ]);
    expect(collectDescendants(index, "ali-a")).toEqual([]);
  });
});

describe("nextSelectionForElement", () => {
  it("cycles empty -> caput and descendants -> caput only -> empty for an Inciso", () => {
    const descendants = collectDescendants(indexFor(), "inc-1");

    const withAll = nextSelectionForElement(
      new Set<string>(),
      "inc-1",
      descendants,
    );
    expect(Array.from(withAll).sort()).toEqual(["ali-a", "ali-b", "inc-1"]);

    const caputOnly = nextSelectionForElement(withAll, "inc-1", descendants);
    expect(Array.from(caputOnly)).toEqual(["inc-1"]);

    const empty = nextSelectionForElement(caputOnly, "inc-1", descendants);
    expect(Array.from(empty)).toEqual([]);
  });

  it("cycles the same way for an Alínea with children, outside the old type list", () => {
    const elements = [
      ...ELEMENTS,
      {
        id: "item-1",
        type: "Item",
        index: "1",
        text: "item;",
        parentId: "ali-a",
      },
    ] as unknown as NormativeElementEntity[];
    const descendants = collectDescendants(indexFor(elements), "ali-a");

    expect(descendants).toEqual(["item-1"]);

    const withAll = nextSelectionForElement(
      new Set<string>(),
      "ali-a",
      descendants,
    );
    expect(Array.from(withAll).sort()).toEqual(["ali-a", "item-1"]);

    const caputOnly = nextSelectionForElement(withAll, "ali-a", descendants);
    expect(Array.from(caputOnly)).toEqual(["ali-a"]);

    expect(
      Array.from(nextSelectionForElement(caputOnly, "ali-a", descendants)),
    ).toEqual([]);
  });

  it("toggles a leaf element between empty and selected", () => {
    const selected = nextSelectionForElement(new Set<string>(), "ali-b", []);
    expect(Array.from(selected)).toEqual(["ali-b"]);
    expect(Array.from(nextSelectionForElement(selected, "ali-b", []))).toEqual(
      [],
    );
  });

  it("keeps the whole subtree when the caput is re-marked from the partial state", () => {
    const descendants = collectDescendants(indexFor(), "inc-1");
    const fromEmpty = nextSelectionForElement(
      new Set(["ali-a"]),
      "inc-1",
      descendants,
    );

    expect(Array.from(fromEmpty).sort()).toEqual(["ali-a", "ali-b", "inc-1"]);
  });
});

/* -------------------------------------------------------------------------- */
/* Links                                                                       */
/* -------------------------------------------------------------------------- */

describe("rebuildDocumentLinks", () => {
  it("creates the link for a document that had none", () => {
    const update = rebuildDocumentLinks(
      [],
      "doc-1",
      new Set(["art-1"]),
      NO_SEGMENTS,
    );

    expect(update.links).toEqual([
      {
        resourceId: "doc-1",
        resourceType: "original_normativo",
        linkedElements: [{ elementId: "art-1" }],
      },
    ]);
    expect(update.preservedSegments).toEqual([]);
  });

  it("drops the link when no element is left, keeping other documents", () => {
    const links: CollectionLink[] = [
      {
        resourceId: "doc-1",
        resourceType: "original_normativo",
        linkedElements: [{ elementId: "art-1" }],
      },
      {
        resourceId: "doc-2",
        resourceType: "original_normativo",
        linkedElements: [{ elementId: "art-9" }],
      },
    ];

    const update = rebuildDocumentLinks(
      links,
      "doc-1",
      new Set<string>(),
      NO_SEGMENTS,
    );

    expect(update.links).toEqual([links[1]]);
  });

  it("never touches the other documents of the selection", () => {
    const links: CollectionLink[] = [
      {
        resourceId: "doc-2",
        resourceType: "original_normativo",
        linkedElements: [{ elementId: "art-9" }],
      },
    ];

    const update = rebuildDocumentLinks(
      links,
      "doc-1",
      new Set(["art-1"]),
      NO_SEGMENTS,
    );

    expect(update.links).toHaveLength(2);
    expect(update.links[0]).toBe(links[0]);
  });

  it("preserves the segments of the elements that leave the selection, and restores them on re-mark", () => {
    const drafts = new Map<string, AnnotatedTextSegment[]>();
    const segmentsFor = makeLookup(drafts);

    const marked = replaceElementSegments(
      rebuildDocumentLinks([], "doc-1", new Set(["art-1"]), segmentsFor).links,
      "doc-1",
      "art-1",
      SEGMENTS,
    );

    const unmarked = rebuildDocumentLinks(
      marked,
      "doc-1",
      new Set<string>(),
      segmentsFor,
    );
    expect(unmarked.links).toEqual([]);
    expect(unmarked.preservedSegments).toEqual([["art-1", SEGMENTS]]);

    unmarked.preservedSegments.forEach(([elementId, segments]) =>
      drafts.set(elementId, segments),
    );

    const remarked = rebuildDocumentLinks(
      unmarked.links,
      "doc-1",
      new Set(["art-1"]),
      segmentsFor,
    );
    expect(remarked.links[0].linkedElements).toEqual([
      { elementId: "art-1", segments: SEGMENTS },
    ]);
  });

  it("preserves the segments of a descendant dropped by the three-state machine", () => {
    const drafts = new Map<string, AnnotatedTextSegment[]>();
    const segmentsFor = makeLookup(drafts);
    const descendants = collectDescendants(indexFor(), "inc-1");

    let links = rebuildDocumentLinks(
      [],
      "doc-1",
      nextSelectionForElement(new Set<string>(), "inc-1", descendants),
      segmentsFor,
    ).links;
    links = replaceElementSegments(links, "doc-1", "ali-a", SEGMENTS);

    const currentIds = selectedIdsForDocument(links, "doc-1");
    const partial = rebuildDocumentLinks(
      links,
      "doc-1",
      nextSelectionForElement(currentIds, "inc-1", descendants),
      segmentsFor,
    );

    expect(partial.links[0].linkedElements).toEqual([{ elementId: "inc-1" }]);
    expect(partial.preservedSegments).toEqual([["ali-a", SEGMENTS]]);

    partial.preservedSegments.forEach(([elementId, segments]) =>
      drafts.set(elementId, segments),
    );

    // Terceiro clique: estado vazio. Quarto clique: subárvore inteira de volta.
    const cleared = rebuildDocumentLinks(
      partial.links,
      "doc-1",
      nextSelectionForElement(
        selectedIdsForDocument(partial.links, "doc-1"),
        "inc-1",
        descendants,
      ),
      segmentsFor,
    );
    expect(cleared.links).toEqual([]);

    const restored = rebuildDocumentLinks(
      cleared.links,
      "doc-1",
      nextSelectionForElement(
        selectedIdsForDocument(cleared.links, "doc-1"),
        "inc-1",
        descendants,
      ),
      segmentsFor,
    );

    expect(restored.links[0].linkedElements).toEqual(
      expect.arrayContaining([{ elementId: "ali-a", segments: SEGMENTS }]),
    );
  });
});

describe("replaceElementSegments", () => {
  it("replaces the segments instead of appending them", () => {
    const other: AnnotatedTextSegment[] = [
      { start: 6, end: 12, selectedText: "criado" },
    ];

    let links = replaceElementSegments([], "doc-1", "art-1", SEGMENTS);
    links = replaceElementSegments(links, "doc-1", "art-1", other);

    expect(links).toHaveLength(1);
    expect(links[0].linkedElements).toEqual([
      { elementId: "art-1", segments: other },
    ]);
  });

  it("clears the segments when the element ends up with none", () => {
    const links = replaceElementSegments(
      replaceElementSegments([], "doc-1", "art-1", SEGMENTS),
      "doc-1",
      "art-1",
      [],
    );

    expect(links[0].linkedElements).toEqual([{ elementId: "art-1" }]);
  });

  it("adds the element to an existing document link", () => {
    const links = replaceElementSegments(
      [
        {
          resourceId: "doc-1",
          resourceType: "original_normativo",
          linkedElements: [{ elementId: "art-1" }],
        },
      ],
      "doc-1",
      "inc-1",
      SEGMENTS,
    );

    expect(links[0].linkedElements).toEqual([
      { elementId: "art-1" },
      { elementId: "inc-1", segments: SEGMENTS },
    ]);
  });
});

describe("collectSegmentDrafts", () => {
  it("seeds the drafts with the segments already persisted", () => {
    const drafts = collectSegmentDrafts([
      {
        resourceId: "doc-1",
        resourceType: "original_normativo",
        linkedElements: [
          { elementId: "art-1", segments: SEGMENTS },
          { elementId: "inc-1" },
          { elementId: "ali-a", segments: [] },
        ],
      },
    ]);

    expect(Array.from(drafts.keys())).toEqual(["art-1"]);
    expect(drafts.get("art-1")).toEqual(SEGMENTS);
  });
});

describe("summarizeSelection", () => {
  const childIndexes = new Map<string, ChildIndex>([["doc-1", indexFor()]]);
  const docCache = { "doc-1": makeDocument() };

  it("marks an element as indeterminate when only the caput is linked", () => {
    const summary = summarizeSelection(
      [
        {
          resourceId: "doc-1",
          resourceType: "original_normativo",
          linkedElements: [{ elementId: "inc-1" }],
        },
      ],
      docCache,
      childIndexes,
    );

    expect(summary.selectedElementIds).toEqual(["inc-1"]);
    expect(summary.indeterminateElementIds).toEqual(["inc-1"]);
  });

  it("does not mark an element as indeterminate when the whole subtree is linked", () => {
    const summary = summarizeSelection(
      [
        {
          resourceId: "doc-1",
          resourceType: "original_normativo",
          linkedElements: [
            { elementId: "inc-1" },
            { elementId: "ali-a", segments: SEGMENTS },
            { elementId: "ali-b" },
          ],
        },
      ],
      docCache,
      childIndexes,
    );

    expect(summary.indeterminateElementIds).toEqual([]);
    expect(summary.elementIdsWithSegments).toEqual(["ali-a"]);
  });

  it("treats a legacy link without elements as the whole document", () => {
    const summary = summarizeSelection(
      [{ resourceId: "doc-1", resourceType: "original_normativo" }],
      docCache,
      childIndexes,
    );

    expect(summary.selectedElementIds).toEqual([
      "art-1",
      "inc-1",
      "ali-a",
      "ali-b",
    ]);
  });
});

describe("buildSelectedGroups", () => {
  it("groups by document, resolves labels and orders by the original", () => {
    const groups = buildSelectedGroups(
      [
        {
          resourceId: "doc-1",
          resourceType: "original_normativo",
          linkedElements: [
            { elementId: "ali-b" },
            { elementId: "art-1", segments: SEGMENTS },
          ],
        },
      ],
      { "doc-1": makeDocument() },
    );

    expect(groups).toHaveLength(1);
    expect(groups[0].documentLabel).toBe("Lei nº 1.234");
    expect(groups[0].wholeDocument).toBe(false);
    expect(groups[0].elements).toEqual([
      { elementId: "art-1", label: "Artigo 1º", segmentCount: 1 },
      { elementId: "ali-b", label: "Alínea b", segmentCount: 0 },
    ]);
  });

  it("falls back to the element id when the document is not cached", () => {
    const groups = buildSelectedGroups(
      [
        {
          resourceId: "doc-9",
          resourceType: "original_normativo",
          linkedElements: [{ elementId: "art-7" }],
        },
      ],
      {},
    );

    expect(groups[0].documentLabel).toBe("Doc doc-9");
    expect(groups[0].elements[0].label).toBe("art-7");
  });

  it("flags a legacy link as the whole document", () => {
    const groups = buildSelectedGroups(
      [{ resourceId: "doc-1", resourceType: "original_normativo" }],
      { "doc-1": makeDocument() },
    );

    expect(groups[0].wholeDocument).toBe(true);
    expect(groups[0].elements).toEqual([]);
  });
});

describe("formatSelectionSummary", () => {
  it("agrees with the singular and the plural", () => {
    expect(formatSelectionSummary(0, 0)).toBe("0 elementos de 0 documentos");
    expect(formatSelectionSummary(1, 1)).toBe("1 elemento de 1 documento");
    expect(formatSelectionSummary(3, 2)).toBe("3 elementos de 2 documentos");
  });
});

/* -------------------------------------------------------------------------- */
/* Render                                                                      */
/* -------------------------------------------------------------------------- */

function render(overrides: Partial<LinkMultiPickerViewProps> = {}) {
  return renderToStaticMarkup(
    <LinkMultiPickerView
      initialLinks={[]}
      onConfirm={() => undefined}
      onBack={() => undefined}
      {...overrides}
    />,
  );
}

describe("LinkMultiPickerView", () => {
  it("renders the single search field, without any dialog", () => {
    const html = render();

    expect(html).toContain("Vínculos normativos");
    expect(html).toContain('placeholder="Buscar dispositivo…"');
    expect(html).toContain('aria-label="Buscar dispositivo"');
    expect(html).not.toContain('role="dialog"');
  });

  it("uses the provided title", () => {
    expect(render({ title: "Vincular normas" })).toContain("Vincular normas");
  });

  it("shows the instruction while the term is empty, without listing elements", () => {
    const html = render();

    expect(html).toContain(
      "Busque por palavra, expressão ou dispositivo para escolher os vínculos.",
    );
    expect(html).not.toContain('role="tree"');
    expect(html).not.toContain("data-element-id=");
  });

  it("offers Cancelar and a disabled Confirmar while nothing is selected", () => {
    const html = render();

    expect(html).toContain("Cancelar");
    expect(html).toContain("Confirmar");
    expect(html).toContain('disabled=""');
    expect(html).toContain("0 elementos de 0 documentos");
  });

  it("counts the pre-existing links and enables Confirmar", () => {
    const html = render({
      initialLinks: [
        {
          resourceId: "doc-1",
          resourceType: "original_normativo",
          linkedElements: [
            { elementId: "art-1" },
            { elementId: "inc-1", segments: SEGMENTS },
          ],
        },
      ],
    });

    expect(html).toContain("2 elementos de 1 documento");
    expect(html).not.toContain('disabled=""');
    expect(html).toContain("Selecionados");
    expect(html).toContain('data-selected-element-id="art-1"');
    expect(html).toContain("1 trecho");
  });

  it("keeps Confirmar enabled when editing existing links to allow removing all links (Item 0133)", () => {
    // When editing pre-existing links, clearing them must allow confirming the deletion
    const html = render({
      initialLinks: [
        {
          resourceId: "doc-1",
          resourceType: "original_normativo",
          linkedElements: [{ elementId: "art-1" }],
        },
      ],
    });

    expect(html).not.toContain('disabled=""');
  });

  it("expands and preloads the documents of the pre-existing links", () => {
    const html = render({
      initialLinks: [
        {
          resourceId: "doc-9",
          resourceType: "original_normativo",
          linkedElements: [{ elementId: "art-3" }],
        },
      ],
    });

    expect(html).toContain('data-doc-id="doc-9"');
    expect(html).toContain('aria-expanded="true"');
  });

  it("lets the current document be linked internally", () => {
    const html = render({ localElements: ELEMENTS });

    expect(html).toContain('role="tree"');
    expect(html).toContain('data-doc-id="current"');
    expect(html).toContain("expanda o documento atual abaixo");
  });

  it("marks the tree as multi-selectable", () => {
    const html = render({ localElements: ELEMENTS });

    expect(html).toContain('aria-multiselectable="true"');
  });
});
