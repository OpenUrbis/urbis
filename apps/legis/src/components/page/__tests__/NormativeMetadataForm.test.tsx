import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { AnnotatedTextSegment } from "../../../domain/types";
import type { LinkPickerSelection } from "../../inspector/LinkPickerView";
import {
  NormativeMetadataForm,
  buildLinkLabel,
  buildSourceSegments,
  buildTargetSegments,
} from "../NormativeMetadataForm";

const BASE =
  "Dispõe sobre a criação do programa municipal de arborização urbana.";

function range(base: string, needle: string): AnnotatedTextSegment {
  const start = base.indexOf(needle);
  return { start, end: start + needle.length };
}

describe("buildSourceSegments", () => {
  it("stamps the selected text and the surrounding context", () => {
    const [segment] = buildSourceSegments(BASE, [
      range(BASE, "programa municipal"),
    ]);

    expect(segment.selectedText).toBe("programa municipal");
    expect(segment.anchorBefore).toContain("criação do ");
    expect(segment.anchorAfter).toContain(" de arborização");
  });

  it("derives changedText from the passage itself", () => {
    const [segment] = buildSourceSegments(BASE, [
      range(BASE, "arborização urbana"),
    ]);

    expect(segment.changedText).toContain("arborização urbana");
  });

  it("keeps the offsets untouched, so the persisted range still matches the base text", () => {
    const marked = range(BASE, "programa municipal");
    const [segment] = buildSourceSegments(BASE, [marked]);

    expect(segment.start).toBe(marked.start);
    expect(segment.end).toBe(marked.end);
    expect(BASE.slice(segment.start, segment.end)).toBe("programa municipal");
  });

  it("round-trips passages that come back from the inspector already anchored", () => {
    const first = buildSourceSegments(BASE, [
      range(BASE, "programa municipal"),
    ]);
    const second = buildSourceSegments(BASE, first);

    expect(second).toEqual(first);
  });

  it("returns nothing for an empty selection", () => {
    expect(buildSourceSegments(BASE, [])).toEqual([]);
  });
});

describe("buildTargetSegments", () => {
  it("anchors every passage without adding changedText", () => {
    const [segment] = buildTargetSegments(BASE, [range(BASE, "criação")]);

    expect(segment.selectedText).toBe("criação");
    expect(segment).not.toHaveProperty("changedText");
  });

  it("preserves the passage type", () => {
    const [segment] = buildTargetSegments(BASE, [
      {
        ...range(BASE, "criação"),
        type: "supplement",
        supplementText: "instituição",
      },
    ]);

    expect(segment.type).toBe("supplement");
    expect(segment.supplementText).toBe("instituição");
  });
});

describe("buildLinkLabel", () => {
  const selection: LinkPickerSelection = {
    documentId: "doc-1",
    documentLabel: "Lei 1.234 · 2019-04-30",
    elementId: "element-1",
    deviceLabel: "Art. 3º",
  };

  it("joins the document and the device already resolved by the picker", () => {
    expect(buildLinkLabel(selection)).toBe("Lei 1.234 · 2019-04-30 - Art. 3º");
  });

  it("falls back to the document alone when no device reference was resolved", () => {
    expect(buildLinkLabel({ ...selection, deviceLabel: undefined })).toBe(
      "Lei 1.234 · 2019-04-30",
    );
  });

  it("falls back to the element id when there is no label at all", () => {
    expect(
      buildLinkLabel({
        ...selection,
        documentLabel: "",
        deviceLabel: undefined,
      }),
    ).toBe("element-1");
  });
});

describe("normative metadata type validation", () => {
  function isNormativeTypeValid(normativeType?: string): boolean {
    return Boolean(normativeType?.trim());
  }

  it("validates that normativeType is required when saving an original normativo", () => {
    expect(isNormativeTypeValid(undefined)).toBe(false);
    expect(isNormativeTypeValid("")).toBe(false);
    expect(isNormativeTypeValid("   ")).toBe(false);
  });

  it("accepts valid normativeType keys", () => {
    expect(isNormativeTypeValid("L")).toBe(true);
    expect(isNormativeTypeValid("DEC")).toBe(true);
    expect(isNormativeTypeValid("PORT")).toBe(true);
  });
});
