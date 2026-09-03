import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SituationCard } from "../SituationCard";
import { SituationGroup } from "../SituationLogic";

function renderSituationCard(
  group: SituationGroup,
  resolveDeviceLabel?: (elementId: string) => string | undefined,
) {
  return renderToStaticMarkup(
    <SituationCard
      group={group}
      defaultExpanded
      resolveDeviceLabel={resolveDeviceLabel}
    />,
  );
}

function makeGroup(overrides: Partial<SituationGroup>): SituationGroup {
  return {
    id: "group-1",
    elementId: "art-1",
    elementKey: "Artigo 1",
    type: "VIGOR_GROUP",
    latestDate: new Date("2016-03-22"),
    situations: [],
    ...overrides,
  };
}

describe("SituationCard", () => {
  it("renders legacy device compatibility fields in the expanded card", () => {
    const html = renderSituationCard({
      id: "group-1",
      elementId: "art-1",
      elementKey: "Artigo 1",
      type: "ALTERATION_GROUP",
      latestDate: new Date("2024-01-01"),
      situations: [
        {
          type: "Alteração de ementa",
          date: "01.01.2024",
          device: "Ementa",
          normativeElementId: "ementa-1",
          newText: "Nova ementa consolidada.",
        },
      ],
    });

    expect(html).toContain("ementa-1");
    expect(html).toContain("Ementa");
    expect(html).toContain("Nova ementa consolidada.");
    expect(html).toContain("Ementa alterada");
  });

  it("renders new text situations with linked device reference and text body", () => {
    const html = renderSituationCard({
      id: "group-2",
      elementId: "art-2",
      elementKey: "Artigo 2",
      type: "EXISTENCE_GROUP",
      latestDate: new Date("2024-02-01"),
      situations: [
        {
          type: "Acréscimo",
          date: "01.02.2024",
          relatedDeviceId: "art-2-a",
          dispositivo: "Art. 2º-A",
          newText: "Fica acrescido o Art. 2º-A com a seguinte redação.",
        },
      ],
    });

    expect(html).toContain("art-2-a");
    expect(html).toContain("Art. 2º-A");
    expect(html).toContain("Texto acrescido");
    expect(html).toContain(
      "Fica acrescido o Art. 2º-A com a seguinte redação.",
    );
  });

  describe("reader-facing presentation", () => {
    const lossOfEffect = makeGroup({
      situations: [
        {
          type: "Perda definitiva de vigor/eficácia",
          date: "22.03.2016",
          relatedDeviceId: "lei_lpuos",
        },
      ],
    });

    it("states the type exactly once instead of repeating it as a heading", () => {
      const html = renderSituationCard(lossOfEffect);
      const occurrences =
        html.split("Perda definitiva de vigor/eficácia").length - 1;

      expect(occurrences).toBe(1);
    });

    it("never shouts the type in uppercase", () => {
      const html = renderSituationCard(lossOfEffect);

      expect(html).not.toContain("PERDA DEFINITIVA DE VIGOR/EFICÁCIA");
    });

    it("explains a whole-device situation in plain language", () => {
      const html = renderSituationCard(lossOfEffect);

      expect(html).toContain(
        "Todo o dispositivo perdeu vigor/eficácia em definitivo.",
      );
      expect(html).not.toContain("Texto integral");
    });

    it('omits the device line instead of printing "Não informado"', () => {
      const html = renderSituationCard(lossOfEffect);

      expect(html).not.toContain("Não informado");
    });

    it("labels the date with a preposition", () => {
      const html = renderSituationCard(lossOfEffect);

      expect(html).toContain("em 22.03.2016");
    });

    it("resolves a raw identifier into a readable reference when possible", () => {
      const html = renderSituationCard(lossOfEffect, (id) =>
        id === "lei_lpuos" ? "Art. 3º" : undefined,
      );

      expect(html).toContain("Art. 3º");
    });

    it("falls back to the identifier only as a technical reference", () => {
      const html = renderSituationCard(lossOfEffect);

      expect(html).toContain("lei_lpuos");
      expect(html).toContain("Origem:");
    });

    it("quotes the affected passage for a partial situation", () => {
      const html = renderSituationCard(
        makeGroup({
          situations: [
            {
              type: "Veto",
              date: "10.05.2020",
              trechos: [
                {
                  start: 0,
                  end: 12,
                  type: "omission",
                  selectedText: "trecho vetado",
                },
              ],
            },
          ],
        }),
      );

      expect(html).toContain("Veto parcial");
      expect(html).toContain("trecho vetado");
      expect(html).toContain("line-through");
    });

    it("describes a renumbering with its new reference", () => {
      const html = renderSituationCard(
        makeGroup({
          type: "ALTERATION_GROUP",
          situations: [
            {
              type: "Renumeração",
              date: "01.01.2020",
              newIndex: "4º",
              newType: "Artigo",
            },
          ],
        }),
      );

      expect(html).toContain("O dispositivo foi renumerado.");
      expect(html).toContain("Passou a ser");
      expect(html).toContain("Artigo 4º");
    });

    it("shows a count only when the group holds more than one situation", () => {
      const single = renderSituationCard(lossOfEffect);
      expect(single).not.toContain(">1<");

      const many = renderSituationCard(
        makeGroup({
          situations: [
            { type: "Suspensão de vigor/eficácia", date: "01.01.2020" },
            { type: "Restauração de vigor/eficácia", date: "01.01.2021" },
          ],
        }),
      );
      expect(many).toContain(">2<");
    });

    it("uses a group title that is not an enumeration of internal types", () => {
      const html = renderSituationCard(lossOfEffect);

      expect(html).toContain("Vigor e eficácia");
      expect(html).not.toContain("Retiradas e Restauração");
    });
  });
});
