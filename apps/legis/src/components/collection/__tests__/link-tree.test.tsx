import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LinkTree, LinkTreeDocument, LinkTreeProps } from "../link-tree";

const DOCUMENT: LinkTreeDocument = {
  id: "doc-1",
  label: "Lei 1.234",
  elements: [
    {
      id: "art-1",
      type: "Artigo",
      index: "1º",
      text: "Fica criado o programa municipal.",
    },
    {
      id: "par-1",
      type: "Parágrafo",
      index: "§ 1º",
      text: "O programa será gratuito.",
      parentId: "art-1",
    },
    {
      id: "inc-1",
      type: "Inciso",
      index: "I",
      text: "atendimento integral;",
      parentId: "par-1",
    },
  ],
  matchedElementIds: [],
};

function render(overrides: Partial<LinkTreeProps> = {}) {
  return renderToStaticMarkup(
    <LinkTree
      documents={[DOCUMENT]}
      expandedDocIds={["doc-1"]}
      onToggleDoc={() => undefined}
      selectionMode="multiple"
      selectedElementIds={[]}
      onToggleElement={() => undefined}
      {...overrides}
    />,
  );
}

describe("LinkTree", () => {
  it("renders the parent -> child hierarchy of an expanded document", () => {
    const html = render();

    expect(html).toContain('role="tree"');
    expect(html).toContain('data-doc-id="doc-1"');
    expect(html).toContain('data-element-id="art-1"');
    expect(html).toContain('data-element-id="par-1"');
    expect(html).toContain('data-element-id="inc-1"');

    expect(html).toContain('role="group"');
    expect(html.indexOf('data-element-id="art-1"')).toBeLessThan(
      html.indexOf('data-element-id="par-1"'),
    );
    expect(html.indexOf('data-element-id="par-1"')).toBeLessThan(
      html.indexOf('data-element-id="inc-1"'),
    );
    expect(html).toContain('aria-level="1"');
    expect(html).toContain('aria-level="2"');
    expect(html).toContain('aria-level="3"');
  });

  it("does not render children of a collapsed document", () => {
    const html = render({ expandedDocIds: [] });

    expect(html).toContain('data-doc-id="doc-1"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain("data-element-id=");
    expect(html).not.toContain("Fica criado o programa municipal.");
  });

  it("filters non-matching branches, keeping matches, siblings and ancestors", () => {
    const unfiltered = render();
    const filtered = render({
      documents: [{ ...DOCUMENT, matchedElementIds: ["art-1"] }],
    });

    expect(unfiltered).toContain('data-element-id="inc-1"');
    expect(filtered).toContain('data-element-id="art-1"');
    expect(filtered).not.toContain('data-element-id="par-1"');
  });

  it("marks a selected element", () => {
    const html = render({ selectedElementIds: ["par-1"] });

    expect(html).toContain('data-element-id="par-1"');
    expect(html).toContain('data-selection-state="selected"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('data-state="checked"');
  });

  it("marks an element whose descendants are not selected as indeterminate", () => {
    const html = render({
      selectedElementIds: ["art-1"],
      indeterminateElementIds: ["art-1"],
    });

    expect(html).toContain('data-selection-state="partial"');
    expect(html).toContain('data-state="indeterminate"');
    expect(html).toContain('aria-checked="mixed"');
    expect(html).toContain('aria-selected="true"');
  });

  it("highlights the search term escaping HTML found in the element text", () => {
    const html = render({
      documents: [
        {
          id: "doc-1",
          label: "Lei 1.234",
          elements: [
            {
              id: "art-1",
              type: "Artigo",
              index: "1º",
              text: "Programa <b>municipal</b> de programa",
            },
          ],
          matchedElementIds: [],
        },
      ],
      highlightTerm: "programa",
    });

    expect(html).toContain("&lt;b&gt;municipal&lt;/b&gt;");
    expect(html).not.toContain("<b>municipal</b>");
    expect(html).toContain(">Programa</mark>");
    expect(html).toContain(">programa</mark>");
  });

  it("does not break with regex metacharacters in the search term", () => {
    const html = render({ highlightTerm: "(programa" });

    expect(html).toContain('data-element-id="art-1"');
    expect(html).not.toContain("<mark");
  });

  it("renders the empty message when there are no documents", () => {
    const html = render({ documents: [], emptyMessage: "Nada aqui." });

    expect(html).toContain("Nada aqui.");
    expect(html).not.toContain('role="tree"');
  });
});
