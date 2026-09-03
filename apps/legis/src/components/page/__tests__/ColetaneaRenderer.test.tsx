import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { withResolvedReferenceSegments } from "../ColetaneaRenderer";
import { ElementContent } from "../NormativeDocumentRenderer";
import { getSegmentBaseText } from "../../../domain/segment-anchor";

const ELEMENT = {
  id: "art-coletanea",
  type: "Artigo",
  index: "1º",
  text: "<p>Art. 1º - Fica criado o programa municipal de arborização urbana.</p>",
  specialSituations: [],
};

function renderReference(element: unknown, segments?: unknown[]) {
  return renderToStaticMarkup(
    <ElementContent
      element={
        withResolvedReferenceSegments(element as any, segments as any) as any
      }
      noteMap={new Map()}
    />,
  );
}

describe("ColetaneaRenderer reference segments", () => {
  it("omits the marked passage instead of slicing raw HTML", () => {
    const base = getSegmentBaseText(ELEMENT as any);
    const start = base.indexOf("programa municipal");
    const html = renderReference(ELEMENT, [
      {
        start,
        end: start + "programa municipal".length,
        type: "omission",
        selectedText: "programa municipal",
        text: "programa municipal",
      },
    ]);

    expect(html).toContain("Fica criado o [...] de arborização urbana.");
    expect(html).not.toContain("<p>");
  });

  it("re-anchors legacy segments whose offsets were measured on the raw HTML", () => {
    const staleOffset = ELEMENT.text.indexOf("programa municipal");
    const html = renderReference(ELEMENT, [
      {
        start: staleOffset,
        end: staleOffset + "programa municipal".length,
        text: "programa municipal",
      },
    ]);

    expect(html).toContain("Fica criado o [...] de arborização urbana.");
    expect(html).not.toContain("municipal de");
  });

  it("keeps supplemented passages with their note", () => {
    const base = getSegmentBaseText(ELEMENT as any);
    const start = base.indexOf("arborização urbana");
    const html = renderReference(ELEMENT, [
      {
        start,
        end: start + "arborização urbana".length,
        type: "supplement",
        selectedText: "arborização urbana",
        supplementText: "grifo nosso",
        text: "grifo nosso",
      },
    ]);

    expect(html).toContain("arborização urbana");
    expect(html).toContain("[grifo nosso]");
    expect(html).not.toContain("[...]");
  });

  it("drops a segment marked over the element prefix instead of omitting the text", () => {
    const html = renderReference(ELEMENT, [
      {
        start: 0,
        end: "Art. 1º -".length,
        type: "omission",
        selectedText: "Art. 1º -",
        text: "Art. 1º -",
      },
    ]);

    expect(html).toContain(
      "Fica criado o programa municipal de arborização urbana.",
    );
    expect(html).not.toContain("[...]");
  });

  it("composes reference segments with the element special situation trechos", () => {
    const base = getSegmentBaseText(ELEMENT as any);
    const referenceStart = base.indexOf("Fica criado");
    const situationStart = base.indexOf("arborização urbana");
    const element = {
      ...ELEMENT,
      specialSituations: [
        {
          type: "Veto",
          date: "01.01.2021",
          trechos: [
            {
              start: situationStart,
              end: situationStart + "arborização urbana".length,
              type: "omission",
              selectedText: "arborização urbana",
            },
          ],
        },
      ],
    };

    const html = renderReference(element, [
      {
        start: referenceStart,
        end: referenceStart + "Fica criado".length,
        type: "omission",
        selectedText: "Fica criado",
      },
    ]);

    expect(html).toContain("[...]");
    expect(html).toContain("(VETADO)");
  });
});
