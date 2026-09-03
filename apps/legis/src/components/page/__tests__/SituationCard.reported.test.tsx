import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SituationCard } from "../SituationCard";
import type { SituationGroup } from "../SituationLogic";

/**
 * Reproduces the exact record that was reported as unreadable in the reading
 * view, and asserts the reader-facing output rather than the markup.
 */
const REPORTED_GROUP: SituationGroup = {
  id: "group-vigor",
  elementId: "art-1",
  elementKey: "Artigo 1",
  type: "VIGOR_GROUP",
  latestDate: new Date("2016-03-22"),
  situations: [
    {
      type: "Perda definitiva de vigor/eficácia",
      date: "22.03.2016",
      relatedDeviceId: "lei_lpuos",
      revokedText: "Texto integral",
    },
  ],
};

function toReadableLines(html: string): string[] {
  return html
    .replace(/<[^>]+>/g, "\n")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

describe("reported situation card", () => {
  it("reads as a sentence instead of a dump of model fields", () => {
    const lines = toReadableLines(
      renderToStaticMarkup(
        <SituationCard group={REPORTED_GROUP} defaultExpanded />,
      ),
    );

    expect(lines).toEqual([
      "Vigor e eficácia",
      "Perda definitiva de vigor/eficácia",
      "em 22.03.2016",
      "Todo o dispositivo perdeu vigor/eficácia em definitivo.",
      "Origem:",
      // O identificador técnico não é texto de leitura: ele fica no tooltip.
      "documento não identificado",
    ]);
  });

  it("keeps the identifier reachable as a tooltip, for traceability", () => {
    const html = renderToStaticMarkup(
      <SituationCard group={REPORTED_GROUP} defaultExpanded />,
    );

    expect(html).toContain('title="Identificador de origem: lei_lpuos"');
  });

  it("drops the placeholder values that used to be shown as content", () => {
    const html = renderToStaticMarkup(
      <SituationCard group={REPORTED_GROUP} defaultExpanded />,
    );

    expect(html).not.toContain("Texto integral");
    expect(html).not.toContain("Não informado");
    expect(html).not.toContain("Texto sem vigor/eficácia");
  });

  it("does not produce a dead anchor for an id outside the document", () => {
    const html = renderToStaticMarkup(
      <SituationCard group={REPORTED_GROUP} defaultExpanded />,
    );

    expect(html).not.toContain("#el-lei_lpuos");
  });

  it("links and names the origin once the id can be resolved", () => {
    const lines = toReadableLines(
      renderToStaticMarkup(
        <SituationCard
          group={REPORTED_GROUP}
          defaultExpanded
          resolveDeviceLabel={(id) =>
            id === "lei_lpuos" ? "Art. 3º" : undefined
          }
        />,
      ),
    );

    expect(lines).toEqual([
      "Vigor e eficácia",
      "Perda definitiva de vigor/eficácia",
      "em 22.03.2016",
      "Todo o dispositivo perdeu vigor/eficácia em definitivo.",
      "Origem:",
      "Art. 3º",
    ]);
  });

  it("names and opens the source act when the id is a document, not a device", () => {
    const html = renderToStaticMarkup(
      <SituationCard
        group={REPORTED_GROUP}
        defaultExpanded
        resolveDocument={(id) =>
          id === "lei_lpuos"
            ? {
                id,
                label: "Lei nº 16.402/2016",
                title: "Lei de Parcelamento, Uso e Ocupação do Solo",
                href: "/pages/lei_lpuos",
              }
            : undefined
        }
      />,
    );

    expect(toReadableLines(html)).toContain("Lei nº 16.402/2016");
    expect(html).toContain('href="/pages/lei_lpuos"');
    // O id continua acessível, agora junto do nome por extenso.
    expect(html).toContain(
      "Lei de Parcelamento, Uso e Ocupação do Solo — lei_lpuos",
    );
    expect(html).not.toContain("#el-lei_lpuos");
  });

  it("prefers the device of this document over the source act link", () => {
    const html = renderToStaticMarkup(
      <SituationCard
        group={REPORTED_GROUP}
        defaultExpanded
        resolveDeviceLabel={(id) =>
          id === "lei_lpuos" ? "Art. 3º" : undefined
        }
        resolveDocument={(id) =>
          id === "lei_lpuos"
            ? {
                id,
                label: "Lei nº 16.402/2016",
                title: "LPUOS",
                href: "/pages/lei_lpuos",
              }
            : undefined
        }
      />,
    );

    expect(html).toContain("#el-lei_lpuos");
    expect(html).not.toContain('href="/pages/lei_lpuos"');
  });
});
