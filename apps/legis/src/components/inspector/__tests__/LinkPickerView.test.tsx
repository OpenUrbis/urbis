import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type {
  NormativeElementEntity,
  OriginalNormativo,
} from "../../../domain/entities";
import type { LinkTreeDocument } from "../../collection/link-tree";
import {
  LinkPickerView,
  LinkResultList,
  buildSnippet,
  countResults,
  formatDeviceKey,
  formatDeviceLabel,
  formatResultSummary,
  groupResultsByDocument,
  resolveDeviceContext,
  resolveDocumentLabel,
  type LinkPickerViewProps,
} from "../LinkPickerView";

const LOCAL_ELEMENTS = [
  {
    id: "art-1",
    type: "Artigo",
    index: "1º",
    text: "Fica criado o programa municipal.",
    originalStartValidity: { type: "date", value: "2020-01-01" },
  },
] as unknown as NormativeElementEntity[];

function makeDocument(
  overrides: Partial<OriginalNormativo> = {},
): OriginalNormativo {
  return {
    id: "doc-1",
    type: "original_normativo",
    normativeType: "L",
    authorityId: "auth-1",
    ementa:
      "Dispõe sobre o programa municipal de atendimento integral à população.",
    elements: [],
    createdAt: "",
    updatedAt: "",
    ...overrides,
  } as OriginalNormativo;
}

function render(overrides: Partial<LinkPickerViewProps> = {}) {
  return renderToStaticMarkup(
    <LinkPickerView
      onSelect={() => undefined}
      onBack={() => undefined}
      {...overrides}
    />,
  );
}

/* -------------------------------------------------------------------------- */
/* Fixtures for the flattened result list                                      */
/* -------------------------------------------------------------------------- */

const SENTENCE =
  "Fica criado o programa municipal de identificação de imóveis.";

const LONG_SENTENCE =
  "Considerando que o presente decreto trata da identificação de " +
  "imóveis urbanos e rurais do município, ficam estabelecidas as regras de cadastro.";

const REMOTE_DOC: LinkTreeDocument = {
  id: "doc-1",
  label: "MENVET 536",
  elements: [
    {
      id: "art-1",
      type: "Art.",
      index: "1º",
      text: "Primeiro artigo, sobre a identificação de imóveis.",
    },
    {
      id: "art-3",
      type: "Art.",
      index: "3º",
      text: "Terceiro artigo, também sobre a identificação de imóveis.",
    },
  ],
  matchedElementIds: ["art-3", "art-1"],
};

const LOCAL_DOC: LinkTreeDocument = {
  id: "current",
  label: "Documento atual",
  elements: [
    {
      id: "loc-1",
      type: "Art.",
      index: "2º",
      text: 'Fica criado o <b>programa</b> "Cidade &amp; Ação".',
    },
  ],
  matchedElementIds: ["loc-1"],
};

const UNCACHED_DOC: LinkTreeDocument = {
  id: "doc-9",
  label: "Lei Cidade Limpa",
  elements: [],
  matchedElementIds: ["unknown-1"],
  isLoading: true,
};

/* -------------------------------------------------------------------------- */
/* buildSnippet                                                                */
/* -------------------------------------------------------------------------- */

describe("buildSnippet", () => {
  it("keeps the whole text when it fits, splitting around the term", () => {
    expect(buildSnippet(SENTENCE, "municipal")).toEqual({
      before: "Fica criado o programa ",
      match: "municipal",
      after: " de identificação de imóveis.",
    });
  });

  it("has no leading ellipsis when the term opens the text", () => {
    const snippet = buildSnippet(SENTENCE, "Fica");

    expect(snippet.before).toBe("");
    expect(snippet.match).toBe("Fica");
    expect(snippet.after.startsWith(" criado")).toBe(true);
  });

  it("trims only the left side when the term closes the text", () => {
    const snippet = buildSnippet(SENTENCE, "imóveis", 20);

    expect(snippet.match).toBe("imóveis");
    expect(snippet.before.startsWith("…")).toBe(true);
    expect(snippet.after).toBe(".");
  });

  it("preserves the original casing of the match", () => {
    expect(buildSnippet("Fica CRIADO o programa", "criado").match).toBe(
      "CRIADO",
    );
  });

  it("centres the window on the term without cutting words", () => {
    const maxLength = 40;
    const snippet = buildSnippet(LONG_SENTENCE, "identificação", maxLength);

    expect(snippet.match).toBe("identificação");
    expect(snippet.before.startsWith("…")).toBe(true);
    expect(snippet.after.endsWith("…")).toBe(true);

    const joined = `${snippet.before}${snippet.match}${snippet.after}`.replace(
      /…/g,
      "",
    );
    expect(joined.length).toBeLessThanOrEqual(maxLength);

    // Whole words only: the window starts and ends on a boundary.
    const start = LONG_SENTENCE.indexOf(joined);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(start === 0 || LONG_SENTENCE[start - 1] === " ").toBe(true);

    const end = start + joined.length;
    expect(end === LONG_SENTENCE.length || LONG_SENTENCE[end] === " ").toBe(
      true,
    );
  });

  it("falls back to the head of the text when the term is absent", () => {
    expect(buildSnippet(SENTENCE, "zoneamento")).toEqual({
      before: SENTENCE,
      after: "",
    });
    expect(buildSnippet(SENTENCE, "   ")).toEqual({
      before: SENTENCE,
      after: "",
    });
  });

  it("truncates the head with an ellipsis when there is no match", () => {
    const snippet = buildSnippet(LONG_SENTENCE, "zoneamento", 30);

    expect(snippet.match).toBeUndefined();
    expect(snippet.after).toBe("");
    expect(snippet.before.endsWith("…")).toBe(true);
    expect(snippet.before.length).toBeLessThanOrEqual(31);
  });

  it("strips markup and decodes entities before highlighting", () => {
    const snippet = buildSnippet(
      "<p>Fica <b>criado</b> o programa &amp; afins</p>",
      "criado",
    );

    expect(snippet).toEqual({
      before: "Fica ",
      match: "criado",
      after: " o programa & afins",
    });
    expect(`${snippet.before}${snippet.after}`).not.toContain("<");
  });

  it("collapses whitespace so the snippet stays on two lines", () => {
    expect(buildSnippet("  Fica \n\n criado   o\tprograma ", "criado")).toEqual(
      {
        before: "Fica ",
        match: "criado",
        after: " o programa",
      },
    );
  });

  it("tolerates empty text", () => {
    expect(buildSnippet("", "municipal")).toEqual({ before: "", after: "" });
  });
});

/* -------------------------------------------------------------------------- */
/* groupResultsByDocument                                                      */
/* -------------------------------------------------------------------------- */

describe("groupResultsByDocument", () => {
  it("puts the current document first, labelled as this document", () => {
    const groups = groupResultsByDocument([REMOTE_DOC, LOCAL_DOC]);

    expect(groups.map((group) => group.documentId)).toEqual([
      "current",
      "doc-1",
    ]);
    expect(groups[0].documentLabel).toBe("Este documento");
  });

  it("flattens matched ids into rows with device label and text", () => {
    const [group] = groupResultsByDocument([REMOTE_DOC]);

    // Ordered by position in the document, not by search order.
    expect(group.results.map((result) => result.elementId)).toEqual([
      "art-1",
      "art-3",
    ]);
    expect(group.results[0]).toEqual({
      documentId: "doc-1",
      elementId: "art-1",
      deviceLabel: "Art. 1º",
      text: "Primeiro artigo, sobre a identificação de imóveis.",
    });
    expect(group.isLoading).toBe(false);
  });

  it("prefers the cached document label once the structure arrives", () => {
    const [group] = groupResultsByDocument([REMOTE_DOC], {
      "doc-1": makeDocument({ number: "536", actDate: "2023-10-20" }),
    });

    expect(group.documentLabel).toBe("Lei nº 536 · 2023-10-20");
  });

  it("keeps the row visible while the structure is still loading", () => {
    const [group] = groupResultsByDocument([UNCACHED_DOC]);

    expect(group.documentLabel).toBe("Lei Cidade Limpa");
    expect(group.isLoading).toBe(true);
    expect(group.results).toEqual([
      {
        documentId: "doc-9",
        elementId: "unknown-1",
        deviceLabel: undefined,
        text: undefined,
      },
    ]);
  });

  it("drops documents without matches and de-duplicates ids", () => {
    const groups = groupResultsByDocument([
      { ...REMOTE_DOC, matchedElementIds: ["art-1", "art-1"] },
      {
        id: "doc-2",
        label: "Sem resultado",
        elements: [],
        matchedElementIds: [],
      },
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].results).toHaveLength(1);
  });
});

describe("countResults / formatResultSummary", () => {
  it("counts every row across the groups", () => {
    expect(countResults(groupResultsByDocument([REMOTE_DOC, LOCAL_DOC]))).toBe(
      3,
    );
    expect(countResults([])).toBe(0);
  });

  it("is honest about the totals", () => {
    expect(formatResultSummary(3, 2)).toBe("3 resultados em 2 documentos");
    expect(formatResultSummary(1, 1)).toBe("1 resultado em 1 documento");
    expect(formatResultSummary(0, 0)).toBe("Nenhum resultado");
  });
});

/* -------------------------------------------------------------------------- */
/* LinkResultList                                                              */
/* -------------------------------------------------------------------------- */

describe("LinkResultList", () => {
  function renderList(
    groups = groupResultsByDocument([LOCAL_DOC, REMOTE_DOC]),
    term = "programa",
  ) {
    return renderToStaticMarkup(
      <LinkResultList
        groups={groups}
        term={term}
        onSelect={() => undefined}
        onBrowse={() => undefined}
      />,
    );
  }

  it("shows the device and the matched passage, not just a counter", () => {
    const html = renderList();

    expect(html).toContain("Art. 2º");
    expect(html).toContain('data-element-id="loc-1"');
    expect(html).toContain("<mark");
    expect(html).toContain("programa");
  });

  it("renders every result as a real button, without any dialog", () => {
    const html = renderList();

    expect(html).toContain(
      '<button type="button" data-doc-id="current" data-element-id="loc-1"',
    );
    expect(html).toContain('data-element-id="art-1"');
    expect(html).toContain('data-element-id="art-3"');
    expect(html).not.toContain('role="dialog"');
    expect(html).not.toContain('role="tree"');
  });

  it("groups by document with a light header and a way into the structure", () => {
    const html = renderList();

    expect(html).toContain("Este documento");
    expect(html).toContain("MENVET 536");
    expect(html).toContain("ver na estrutura");
    expect(html.indexOf("Este documento")).toBeLessThan(
      html.indexOf("MENVET 536"),
    );
  });

  it("escapes the element markup instead of injecting it", () => {
    const html = renderList();

    expect(html).not.toContain("<b>");
    expect(html).toContain("&amp;");
  });

  it("shows a loading placeholder while the text is unknown", () => {
    const html = renderList(groupResultsByDocument([UNCACHED_DOC]));

    expect(html).toContain("Carregando texto…");
    expect(html).toContain('data-element-id="unknown-1"');
  });

  it("marks the pre-selected row", () => {
    const html = renderToStaticMarkup(
      <LinkResultList
        groups={groupResultsByDocument([REMOTE_DOC])}
        term="identificação"
        selectedElementId="art-3"
        onSelect={() => undefined}
        onBrowse={() => undefined}
      />,
    );

    expect(html).toContain('aria-current="true"');
  });
});

/* -------------------------------------------------------------------------- */
/* View                                                                       */
/* -------------------------------------------------------------------------- */

describe("LinkPickerView", () => {
  it("renders the single search field, without any dialog", () => {
    const html = render();

    expect(html).toContain("Vincular dispositivo");
    expect(html).toContain('placeholder="Buscar dispositivo…"');
    expect(html).toContain('aria-label="Buscar dispositivo"');
    expect(html).not.toContain('role="dialog"');
  });

  it("uses the provided title", () => {
    expect(render({ title: "Norma de origem" })).toContain("Norma de origem");
  });

  it("shows the instruction while the term is empty, without listing elements", () => {
    const html = render();

    expect(html).toContain(
      "Busque por palavra, expressão ou dispositivo para escolher o vínculo.",
    );
    expect(html).not.toContain('role="tree"');
    expect(html).not.toContain("data-element-id=");
  });

  it("keeps the advanced filters disclosure closed by default", () => {
    const html = render();

    expect(html).toContain("Filtros avançados");
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain("Tipo normativo");
    expect(html).not.toContain("Data do ato");
  });

  it("offers the current document as a browsable shortcut, labelled as this document", () => {
    const html = render({ localElements: LOCAL_ELEMENTS });

    expect(html).toContain("Navegar em este documento");
    expect(html).toContain(
      "Cada resultado mostra o dispositivo e o trecho que casou.",
    );
    // The tree only shows up once the user asks for it.
    expect(html).not.toContain('role="tree"');
    expect(html).not.toContain("Documento current");
  });

  it("opens the already chosen document in navigation mode", () => {
    const html = render({
      initialSelection: { documentId: "doc-9", elementId: "art-3" },
    });

    expect(html).toContain('role="tree"');
    expect(html).toContain('data-doc-id="doc-9"');
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain("Voltar à busca");
  });
});

describe("resolveDocumentLabel", () => {
  it("labels the current document explicitly", () => {
    expect(resolveDocumentLabel(undefined, "current")).toBe("Este documento");
  });

  it("falls back to the id when the document is not cached yet", () => {
    expect(resolveDocumentLabel(undefined, "doc-1")).toBe("Doc doc-1");
  });

  it("prefers the Legis designation, appending the act date when it carries no year", () => {
    expect(
      resolveDocumentLabel(makeDocument({ number: "1.234" }), "doc-1"),
    ).toBe("Lei nº 1.234");
    expect(
      resolveDocumentLabel(
        makeDocument({ number: "1.234", actDate: "2019-04-30" }),
        "doc-1",
      ),
    ).toBe("Lei nº 1.234 · 2019-04-30");
  });

  it("does not repeat the year when the designation already has it", () => {
    expect(
      resolveDocumentLabel(
        makeDocument({ number: "1.234", actDate: "30.04.2019" }),
        "doc-1",
      ),
    ).toBe("Lei nº 1.234/2019");
  });

  it("truncates the ementa when there is no number", () => {
    expect(resolveDocumentLabel(makeDocument(), "doc-1")).toBe(
      "Dispõe sobre o programa municipal de ate...",
    );
  });

  it("falls back to the id when there is neither number nor ementa", () => {
    expect(resolveDocumentLabel(makeDocument({ ementa: "   " }), "doc-1")).toBe(
      "Doc doc-1",
    );
  });
});

describe("formatDeviceLabel", () => {
  it("joins type and index", () => {
    expect(formatDeviceLabel({ type: "Art.", index: "3º" })).toBe("Art. 3º");
  });

  it("accepts an element without index", () => {
    expect(formatDeviceLabel({ type: "Ementa" })).toBe("Ementa");
  });

  it("returns undefined when there is nothing legible", () => {
    expect(formatDeviceLabel(undefined)).toBeUndefined();
    expect(formatDeviceLabel({})).toBeUndefined();
  });
});

describe("formatDeviceKey", () => {
  it("uses the key the document itself shows", () => {
    expect(formatDeviceKey({ type: "Artigo", index: "37" })).toBe("Art. 37");
    expect(formatDeviceKey({ type: "Parágrafo", index: "1º" })).toBe("§ 1º");
    expect(formatDeviceKey({ type: "Inciso", index: "I" })).toBe("I");
  });

  it("falls back to type and index when the element has no key", () => {
    expect(formatDeviceKey({ type: "Texto" })).toBe("Texto");
    expect(formatDeviceKey(undefined)).toBeUndefined();
  });
});

describe("resolveDeviceContext", () => {
  const byId = new Map([
    [
      "art-231",
      { id: "art-231", type: "Artigo", index: "231", text: "Art. 231 ..." },
    ],
    [
      "par-6",
      {
        id: "par-6",
        type: "Parágrafo",
        index: "6º",
        text: "§ 6º ...",
        parentId: "art-231",
      },
    ],
    [
      "txt-1",
      { id: "txt-1", type: "Texto", text: "Texto solto", parentId: "par-6" },
    ],
    ["txt-orphan", { id: "txt-orphan", type: "Texto", text: "Sem pai" }],
  ]);

  it("names the closest device that has a key", () => {
    expect(resolveDeviceContext(byId.get("txt-1"), byId)).toBe("§ 6º");
  });

  it("names the article for devices that mean nothing on their own", () => {
    expect(resolveDeviceContext(byId.get("par-6"), byId)).toBe("Art. 231");
  });

  it("stays quiet for devices that explain themselves", () => {
    expect(
      resolveDeviceContext(
        {
          id: "art-1",
          type: "Artigo",
          index: "1º",
          text: "",
          parentId: "cap-1",
        },
        byId,
      ),
    ).toBeUndefined();
  });

  it("stays quiet when there is no parent to name", () => {
    expect(resolveDeviceContext(byId.get("txt-orphan"), byId)).toBeUndefined();
    expect(resolveDeviceContext(undefined, byId)).toBeUndefined();
  });
});
