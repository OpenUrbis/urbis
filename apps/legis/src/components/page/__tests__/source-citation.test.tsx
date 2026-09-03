import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SituationCard } from "../SituationCard";
import { getSituationPresentation } from "../situation-presentation";
import type { SituationGroup } from "../SituationLogic";
import { buildCitationFromAnchoredSegments } from "../../../domain/text-utils";
import { withSegmentAnchor } from "../../../domain/segment-anchor";

/**
 * A veto links to a device of the veto act, which usually holds several
 * provisions. What gets marked there is what is QUOTED — the surroundings are
 * elided with "[...]".
 */
const SOURCE_TEXT =
  "Ficam vetados os arts. 3º e 4º do projeto de lei aprovado.";
const FRAGMENT = "arts. 3º e 4º";
const FRAGMENT_START = SOURCE_TEXT.indexOf(FRAGMENT);

const SOURCE_SEGMENT = withSegmentAnchor(SOURCE_TEXT, {
  start: FRAGMENT_START,
  end: FRAGMENT_START + FRAGMENT.length,
  type: "omission",
});

function makeGroup(sourceTrechos?: (typeof SOURCE_SEGMENT)[]): SituationGroup {
  return {
    id: "group-veto",
    elementId: "art-1",
    elementKey: "Artigo 1",
    type: "VETO_GROUP",
    latestDate: new Date("2023-10-20"),
    situations: [
      {
        type: "Veto",
        date: "20.10.2023",
        sourceDocumentLabel: "MENVET 536 · 20.10.2023",
        relatedDeviceId: "el-veto-1",
        dispositivo: "Art. 1º",
        sourceTrechos,
      },
    ],
  };
}

describe("buildCitationFromAnchoredSegments", () => {
  it("rebuilds the citation without access to the source text", () => {
    // The reading view cannot reach the other document, so the citation is
    // reconstructed from the anchors stored on each passage.
    expect(buildCitationFromAnchoredSegments([SOURCE_SEGMENT])).toBe(
      `[...] ${FRAGMENT} [...]`,
    );
  });

  it("omits the leading ellipsis when the passage opens the text", () => {
    const opening = withSegmentAnchor(SOURCE_TEXT, {
      start: 0,
      end: 13,
      type: "omission",
    });

    expect(buildCitationFromAnchoredSegments([opening])).toBe(
      "Ficam vetados [...]",
    );
  });

  it("omits the trailing ellipsis when the passage closes the text", () => {
    const closingStart = SOURCE_TEXT.indexOf("aprovado.");
    const closing = withSegmentAnchor(SOURCE_TEXT, {
      start: closingStart,
      end: SOURCE_TEXT.length,
      type: "omission",
    });

    expect(buildCitationFromAnchoredSegments([closing])).toBe(
      "[...] aprovado.",
    );
  });

  it("joins several quoted fragments", () => {
    const first = withSegmentAnchor(SOURCE_TEXT, {
      start: 6,
      end: 13,
      type: "omission",
    });
    const second = withSegmentAnchor(SOURCE_TEXT, {
      start: FRAGMENT_START,
      end: FRAGMENT_START + FRAGMENT.length,
      type: "omission",
    });

    expect(buildCitationFromAnchoredSegments([first, second])).toBe(
      `[...] vetados [...] ${FRAGMENT} [...]`,
    );
  });

  it("returns undefined when there is nothing quoted", () => {
    expect(buildCitationFromAnchoredSegments([])).toBeUndefined();
    expect(buildCitationFromAnchoredSegments(undefined)).toBeUndefined();
  });
});

describe("situation presentation with a source citation", () => {
  it("exposes the citation on the origin", () => {
    const presentation = getSituationPresentation(
      makeGroup([SOURCE_SEGMENT]).situations[0],
    );

    expect(presentation.origin?.citation).toBe(`[...] ${FRAGMENT} [...]`);
  });

  it("has no citation when the whole source device is referenced", () => {
    const presentation = getSituationPresentation(makeGroup().situations[0]);

    expect(presentation.origin?.citation).toBeUndefined();
    expect(presentation.origin?.documentLabel).toBe("MENVET 536 · 20.10.2023");
  });
});

describe("SituationCard with a source citation", () => {
  it("quotes the source fragment in the reading view", () => {
    const html = renderToStaticMarkup(
      <SituationCard group={makeGroup([SOURCE_SEGMENT])} defaultExpanded />,
    );

    expect(html).toContain("MENVET 536");
    expect(html).toContain(FRAGMENT);
    expect(html).toContain("[...]");
    expect(html).toContain("<blockquote");
  });

  it("shows only the reference when the whole device is cited", () => {
    const html = renderToStaticMarkup(
      <SituationCard group={makeGroup()} defaultExpanded />,
    );

    expect(html).toContain("MENVET 536");
    expect(html).not.toContain("[...]");
  });
});
