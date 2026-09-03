import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isElementInactive,
  isFutureValidity,
  processElementsForConsolidated,
} from "../ConsolidationLogic";
import {
  ElementType,
  NormativeElementEntity,
  SpecialSituation,
  SpecialSituationType,
} from "../../../domain/entities";

// Frozen "now" used by every date-sensitive assertion below.
const NOW = new Date(2024, 5, 15, 12, 0, 0);
const TODAY = "15.06.2024";
const YESTERDAY = "14.06.2024";
const TOMORROW = "16.06.2024";

const ALL_SITUATION_TYPES: SpecialSituationType[] = [
  "Vigência inicial alterada",
  "Vigência final alterada",
  "Veto",
  "Derrubada de veto",
  "Renumeração",
  "Nova redação",
  "Perda definitiva de vigor/eficácia",
  "Suspensão de vigor/eficácia",
  "Revogação",
  "Anulação",
  "Cassação",
  "Restauração de vigor/eficácia",
  "Interpretação conforme à Constituição",
  "Declaração de inconstitucionalidade sem redução de texto",
  "Acréscimo",
  "Repristinação",
  "Alteração de ementa",
];

const REVOCATION_FAMILY: SpecialSituationType[] = [
  "Revogação",
  "Anulação",
  "Cassação",
  "Perda definitiva de vigor/eficácia",
  "Suspensão de vigor/eficácia",
];

const NON_INACTIVATING_TYPES: SpecialSituationType[] =
  ALL_SITUATION_TYPES.filter(
    (type) => type !== "Veto" && !REVOCATION_FAMILY.includes(type),
  );

const createElement = (
  id: string,
  situations: SpecialSituation[] = [],
  type: string = "Artigo",
  overrides: Partial<NormativeElementEntity> = {},
): NormativeElementEntity => ({
  id,
  type: type as ElementType,
  index: "1",
  text: `Texto de ${id}`,
  specialSituations: situations,
  originalStartValidity: { date: "01.01.2020", deviceId: "Lei 1" },
  ...overrides,
});

const revoked = (id: string, type: string = "Artigo") =>
  createElement(id, [{ type: "Revogação", date: "01.01.2021" }], type);

const ids = (elements: NormativeElementEntity[]) => elements.map((el) => el.id);

describe("ConsolidationLogic (extra)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("isElementInactive - originalEndValidity", () => {
    it("is inactive when the end of validity is in the past", () => {
      const el = createElement("1", [], "Artigo", {
        originalEndValidity: { date: YESTERDAY, deviceId: "Lei 2" },
      });

      expect(isElementInactive(el)).toBe(true);
    });

    it("is active when the end of validity is in the future", () => {
      const el = createElement("1", [], "Artigo", {
        originalEndValidity: { date: TOMORROW, deviceId: "Lei 2" },
      });

      expect(isElementInactive(el)).toBe(false);
    });

    it("is inactive on the very day validity ends, because the date is parsed at midnight", () => {
      const el = createElement("1", [], "Artigo", {
        originalEndValidity: { date: TODAY, deviceId: "Lei 2" },
      });

      expect(isElementInactive(el)).toBe(true);
    });

    it("ignores a conditional end of validity", () => {
      const el = createElement("1", [], "Artigo", {
        originalEndValidity: {
          date: "vigência condicionada",
          deviceId: "Lei 2",
        },
      });

      expect(isElementInactive(el)).toBe(false);
    });

    it("ignores an unparsable end of validity", () => {
      const el = createElement("1", [], "Artigo", {
        originalEndValidity: { date: "2020-01-01", deviceId: "Lei 2" },
      });

      expect(isElementInactive(el)).toBe(false);
      expect(
        isElementInactive(
          createElement("2", [], "Artigo", {
            originalEndValidity: { date: "data inválida", deviceId: "Lei 2" },
          }),
        ),
      ).toBe(false);
    });

    it("accepts single digit day/month in the end of validity", () => {
      const el = createElement("1", [], "Artigo", {
        originalEndValidity: { date: "1.1.2021", deviceId: "Lei 2" },
      });

      expect(isElementInactive(el)).toBe(true);
    });

    it("short-circuits on an expired end of validity even when the latest situation is harmless", () => {
      const el = createElement(
        "1",
        [{ type: "Nova redação", date: "01.01.2024" }],
        "Artigo",
        {
          originalEndValidity: { date: YESTERDAY, deviceId: "Lei 2" },
        },
      );

      expect(isElementInactive(el)).toBe(true);
    });
  });

  describe("isElementInactive - situations", () => {
    it("is active when there are no situations at all", () => {
      expect(isElementInactive(createElement("1"))).toBe(false);
    });

    it("is active when specialSituations is missing (legacy records)", () => {
      const el = createElement("1", [], "Artigo", {
        specialSituations: undefined as unknown as SpecialSituation[],
      });

      expect(isElementInactive(el)).toBe(false);
    });

    it.each(REVOCATION_FAMILY)(
      'is inactive when the latest situation is "%s"',
      (type) => {
        expect(
          isElementInactive(createElement("1", [{ type, date: "01.01.2021" }])),
        ).toBe(true);
      },
    );

    it.each(NON_INACTIVATING_TYPES)(
      'stays active when the latest situation is "%s"',
      (type) => {
        expect(
          isElementInactive(createElement("1", [{ type, date: "01.01.2021" }])),
        ).toBe(false);
      },
    );

    it("is inactive for a Veto whether or not the text says (VETADO)", () => {
      const situations: SpecialSituation[] = [
        { type: "Veto", date: "01.01.2021" },
      ];

      expect(
        isElementInactive(
          createElement("1", situations, "Artigo", { text: "(VETADO)" }),
        ),
      ).toBe(true);
      expect(
        isElementInactive(
          createElement("2", situations, "Artigo", { text: "Texto normal" }),
        ),
      ).toBe(true);
    });

    it("hides the whole element even for a partial Veto restricted to trechos", () => {
      const el = createElement("1", [
        {
          type: "Veto",
          date: "01.01.2021",
          vetoText: "apenas este trecho",
          trechos: [
            {
              start: 10,
              end: 28,
              type: "omission",
              omissionPlaceholder: "(VETADO)",
            },
          ],
        },
      ]);

      expect(isElementInactive(el)).toBe(true);
    });

    it("hides the whole element even for a partial revocation restricted to trechos", () => {
      const el = createElement("1", [
        {
          type: "Revogação",
          date: "01.01.2021",
          revokedText: "apenas este trecho",
          trechos: [{ start: 0, end: 5 }],
        },
      ]);

      expect(isElementInactive(el)).toBe(true);
    });

    it('keeps a whole-device "Nova redação" active, with or without trechos', () => {
      const whole = createElement("1", [
        {
          type: "Nova redação",
          date: "01.01.2021",
          newText: "Texto integral novo",
        },
      ]);
      const partial = createElement("2", [
        {
          type: "Nova redação",
          date: "01.01.2021",
          newText: "trecho novo",
          trechos: [{ start: 3, end: 9, type: "supplement" }],
          newTextTrechos: [{ start: 0, end: 11 }],
        },
      ]);

      expect(isElementInactive(whole)).toBe(false);
      expect(isElementInactive(partial)).toBe(false);
    });

    it("is inactive when a revocation is the latest of several situations", () => {
      const el = createElement("1", [
        { type: "Acréscimo", date: "01.01.2020" },
        { type: "Nova redação", date: "01.01.2022" },
        { type: "Revogação", date: "01.01.2023" },
      ]);

      expect(isElementInactive(el)).toBe(true);
    });

    it('is active again when a "Nova redação" is later than the revocation', () => {
      const el = createElement("1", [
        { type: "Revogação", date: "01.01.2021" },
        { type: "Nova redação", date: "01.01.2022" },
      ]);

      expect(isElementInactive(el)).toBe(false);
    });

    it("does not depend on the order the situations are stored in", () => {
      const chronological = createElement("1", [
        { type: "Nova redação", date: "01.01.2021" },
        { type: "Revogação", date: "01.01.2023" },
      ]);
      const reversed = createElement("2", [
        { type: "Revogação", date: "01.01.2023" },
        { type: "Nova redação", date: "01.01.2021" },
      ]);

      expect(isElementInactive(chronological)).toBe(true);
      expect(isElementInactive(reversed)).toBe(true);
    });

    it("uses the latest occurrence when the same type repeats", () => {
      const twiceRevoked = createElement("1", [
        { type: "Revogação", date: "01.01.2019" },
        { type: "Revogação", date: "01.01.2023" },
      ]);
      const vetoedAgainAfterOverturn = createElement("2", [
        { type: "Veto", date: "01.01.2020" },
        { type: "Derrubada de veto", date: "01.01.2021" },
        { type: "Veto", date: "01.01.2022" },
      ]);
      const overturnedTwice = createElement("3", [
        { type: "Veto", date: "01.01.2020" },
        { type: "Derrubada de veto", date: "01.01.2021" },
        { type: "Veto", date: "01.01.2022" },
        { type: "Derrubada de veto", date: "01.06.2022" },
      ]);

      expect(isElementInactive(twiceRevoked)).toBe(true);
      expect(isElementInactive(vetoedAgainAfterOverturn)).toBe(true);
      expect(isElementInactive(overturnedTwice)).toBe(false);
    });

    it("breaks ties between same-dated situations by keeping the stored order", () => {
      const overturnFirst = createElement("1", [
        { type: "Derrubada de veto", date: "01.01.2021" },
        { type: "Veto", date: "01.01.2021" },
      ]);
      const vetoFirst = createElement("2", [
        { type: "Veto", date: "01.01.2021" },
        { type: "Derrubada de veto", date: "01.01.2021" },
      ]);

      expect(isElementInactive(overturnFirst)).toBe(false);
      expect(isElementInactive(vetoFirst)).toBe(true);
    });

    it("treats a missing date as the epoch, so any dated situation outranks it", () => {
      const undatedRevocation = createElement("1", [
        { type: "Revogação" },
        { type: "Nova redação", date: "01.01.2021" },
      ]);

      expect(isElementInactive(undatedRevocation)).toBe(false);
    });

    it("falls back to the stored order when every situation lacks a date", () => {
      const revocationFirst = createElement("1", [
        { type: "Revogação" },
        { type: "Nova redação" },
      ]);
      const redactionFirst = createElement("2", [
        { type: "Nova redação" },
        { type: "Revogação" },
      ]);

      expect(isElementInactive(revocationFirst)).toBe(true);
      expect(isElementInactive(redactionFirst)).toBe(false);
    });

    it("treats an unparsable situation date as the epoch", () => {
      const el = createElement("1", [
        { type: "Revogação", date: "31.02.2020" },
        { type: "Nova redação", date: "01.01.1990" },
      ]);

      expect(isElementInactive(el)).toBe(false);
      // Alone, the unparsable revocation still inactivates the element.
      expect(
        isElementInactive(
          createElement("2", [{ type: "Revogação", date: "31.02.2020" }]),
        ),
      ).toBe(true);
    });

    it('treats "vigência condicionada" as the epoch', () => {
      const el = createElement("1", [
        { type: "Revogação", date: "vigência condicionada" },
        { type: "Nova redação", date: "01.01.1990" },
      ]);

      expect(isElementInactive(el)).toBe(false);
      expect(
        isElementInactive(
          createElement("2", [
            { type: "Revogação", date: "vigência condicionada" },
          ]),
        ),
      ).toBe(true);
    });

    it("inactivates immediately for a revocation dated in the future", () => {
      const el = createElement("1", [
        { type: "Revogação", date: "01.01.2030" },
      ]);

      expect(isElementInactive(el)).toBe(true);
    });

    it('ignores "Vigência final alterada" even when the new end date is already past', () => {
      const el = createElement("1", [
        { type: "Vigência final alterada", date: YESTERDAY },
      ]);

      expect(isElementInactive(el)).toBe(false);
    });

    it('ignores "Vigência inicial alterada" even when validity has not started yet', () => {
      const el = createElement("1", [
        { type: "Vigência inicial alterada", date: "01.01.2030" },
      ]);

      expect(isElementInactive(el)).toBe(false);
    });

    it("keeps a renumbered element active", () => {
      const el = createElement("1", [
        {
          type: "Renumeração",
          date: "01.01.2021",
          newIndex: "5º",
          newType: "Artigo",
        },
      ]);

      expect(isElementInactive(el)).toBe(false);
    });

    it('keeps an added ("Acréscimo") element active', () => {
      const el = createElement("1", [
        {
          type: "Acréscimo",
          date: "01.01.2021",
          newText: "Parágrafo acrescido",
        },
      ]);

      expect(isElementInactive(el)).toBe(false);
    });

    it('reactivates a revoked element through "Repristinação" and through "Restauração de vigor/eficácia"', () => {
      const repristinated = createElement("1", [
        { type: "Perda definitiva de vigor/eficácia", date: "01.01.2021" },
        { type: "Repristinação", date: "01.01.2022" },
      ]);
      const restored = createElement("2", [
        { type: "Suspensão de vigor/eficácia", date: "01.01.2021" },
        { type: "Restauração de vigor/eficácia", date: "01.01.2022" },
      ]);

      expect(isElementInactive(repristinated)).toBe(false);
      expect(isElementInactive(restored)).toBe(false);
    });

    it("is not influenced by legacy/compatibility fields of the situation", () => {
      const legacyRevocation = createElement("1", [
        {
          type: "Revogação",
          date: "01.01.2021",
          device: "Art. 3º da Lei 9",
          normativeElementId: "el-9",
          sourceSegments: [{ start: 0, end: 4, changedText: "abc" }],
          targetSegments: [{ start: 0, end: 4 }],
        },
      ]);
      const modernRevocation = createElement("2", [
        {
          type: "Revogação",
          date: "01.01.2021",
          dispositivo: "Art. 3º da Lei 9",
          relatedDeviceId: "el-9",
        },
      ]);
      const legacyRedaction = createElement("3", [
        {
          type: "Nova redação",
          date: "01.01.2021",
          device: "Art. 4º da Lei 9",
          normativeElementId: "el-4",
          sourceSegments: [{ start: 0, end: 2 }],
        },
      ]);

      expect(isElementInactive(legacyRevocation)).toBe(true);
      expect(isElementInactive(modernRevocation)).toBe(true);
      expect(isElementInactive(legacyRedaction)).toBe(false);
    });

    it("behaves the same for any element type", () => {
      const types = [
        "Artigo",
        "Parágrafo",
        "Inciso",
        "Alínea",
        "Item",
        "Capítulo",
        "Seção",
        "Anexo",
        "Tabela",
      ];

      types.forEach((type) => {
        expect(isElementInactive(revoked(`rev-${type}`, type))).toBe(true);
        expect(isElementInactive(createElement(`ok-${type}`, [], type))).toBe(
          false,
        );
      });
    });
  });

  describe("isFutureValidity", () => {
    it.each<SpecialSituationType>([
      "Vigência inicial alterada",
      "Vigência final alterada",
    ])('returns true for "%s"', (type) => {
      expect(isFutureValidity({ type })).toBe(true);
    });

    it.each(ALL_SITUATION_TYPES.filter((type) => !type.startsWith("Vigência")))(
      'returns false for "%s"',
      (type) => {
        expect(isFutureValidity({ type })).toBe(false);
      },
    );

    it("only looks at the type, never at the date or the affected trechos", () => {
      expect(
        isFutureValidity({
          type: "Vigência inicial alterada",
          date: "01.01.1990",
        }),
      ).toBe(true);
      expect(
        isFutureValidity({
          type: "Vigência final alterada",
          date: "vigência condicionada",
        }),
      ).toBe(true);
      expect(
        isFutureValidity({
          type: "Nova redação",
          date: "01.01.2030",
          trechos: [{ start: 0, end: 2 }],
        }),
      ).toBe(false);
    });
  });

  describe("processElementsForConsolidated", () => {
    it("returns an empty list for an empty input", () => {
      expect(processElementsForConsolidated([])).toEqual([]);
    });

    it("keeps a single active element by reference in a new array", () => {
      const el = createElement("1");
      const input = [el];

      const result = processElementsForConsolidated(input);

      expect(result).not.toBe(input);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(el);
    });

    it("replaces a single inactive element with a fully formed separator", () => {
      const result = processElementsForConsolidated([revoked("art-1")]);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "sep-art-1",
        type: "Separator",
        text: "[...]",
        index: "",
      });
      expect(result[0].specialSituations).toEqual([]);
      expect(result[0].originalStartValidity).toEqual({
        date: "",
        deviceId: "",
        normativeElementId: "",
      });
    });

    it("adds a leading separator when the document starts with inactive elements", () => {
      const result = processElementsForConsolidated([
        revoked("art-1"),
        revoked("art-2"),
        createElement("art-3"),
      ]);

      expect(ids(result)).toEqual(["sep-art-1", "art-3"]);
    });

    it("adds a trailing separator when the document ends with inactive elements", () => {
      const result = processElementsForConsolidated([
        createElement("art-1"),
        revoked("art-2"),
        revoked("art-3"),
      ]);

      expect(ids(result)).toEqual(["art-1", "sep-art-2"]);
    });

    it("emits one separator per run of inactive elements, named after the first of the run", () => {
      const result = processElementsForConsolidated([
        createElement("art-1"),
        revoked("art-2"),
        revoked("art-3"),
        createElement("art-4"),
        revoked("art-5"),
        createElement("art-6"),
      ]);

      expect(ids(result)).toEqual([
        "art-1",
        "sep-art-2",
        "art-4",
        "sep-art-5",
        "art-6",
      ]);
    });

    it("inactivates a Capítulo whose whole content is inactive, collapsing it into one separator", () => {
      const result = processElementsForConsolidated([
        createElement("cap-1", [], "Capítulo"),
        revoked("art-1"),
        revoked("art-2"),
        createElement("cap-2", [], "Capítulo"),
        createElement("art-3"),
      ]);

      expect(ids(result)).toEqual(["sep-cap-1", "cap-2", "art-3"]);
    });

    it("keeps a Capítulo visible when at least one child survives", () => {
      const result = processElementsForConsolidated([
        createElement("cap-1", [], "Capítulo"),
        revoked("art-1"),
        createElement("art-2"),
      ]);

      expect(ids(result)).toEqual(["cap-1", "sep-art-1", "art-2"]);
    });

    it("keeps an empty header visible because it has no content to judge", () => {
      const result = processElementsForConsolidated([
        createElement("cap-1", [], "Capítulo"),
        createElement("cap-2", [], "Capítulo"),
        createElement("art-1"),
      ]);

      expect(ids(result)).toEqual(["cap-1", "cap-2", "art-1"]);
    });

    it("stops scanning a header content at the next header of equal or higher level", () => {
      const result = processElementsForConsolidated([
        createElement("tit-1", [], "Título"),
        createElement("cap-1", [], "Capítulo"),
        createElement("art-1"),
        createElement("cap-2", [], "Capítulo"),
        revoked("art-2"),
      ]);

      // cap-2 only owns art-2 (revoked), so it dies with it; cap-1/tit-1 survive.
      expect(ids(result)).toEqual(["tit-1", "cap-1", "art-1", "sep-cap-2"]);
    });

    it("inactivates a header that carries a revocation of its own", () => {
      const result = processElementsForConsolidated([
        revoked("cap-1", "Capítulo"),
        createElement("art-1"),
      ]);

      expect(ids(result)).toEqual(["sep-cap-1", "art-1"]);
    });

    it("only collapses the innermost header of a deep hierarchy, because nested headers count as live content", () => {
      const result = processElementsForConsolidated([
        createElement("tit-1", [], "Título"),
        createElement("cap-1", [], "Capítulo"),
        createElement("sec-1", [], "Seção"),
        revoked("art-1"),
        revoked("art-2"),
      ]);

      // Ancestors are evaluated against the *raw* status of their children, and
      // sec-1/cap-1 are individually active, so only sec-1 collapses.
      expect(ids(result)).toEqual(["tit-1", "cap-1", "sep-sec-1"]);
    });

    it("collapses a Subseção whose content is entirely inactive", () => {
      const result = processElementsForConsolidated([
        createElement("sub-1", [], "Subseção"),
        revoked("art-1"),
        createElement("art-2"),
      ]);

      expect(ids(result)).toEqual(["sub-1", "sep-art-1", "art-2"]);
      expect(
        ids(
          processElementsForConsolidated([
            createElement("sub-1", [], "Subseção"),
            revoked("art-1"),
          ]),
        ),
      ).toEqual(["sep-sub-1"]);
    });

    it("never collapses an Anexo, since it is not part of the header hierarchy", () => {
      const result = processElementsForConsolidated([
        createElement("anexo-1", [], "Anexo"),
        revoked("tab-1", "Tabela"),
        revoked("art-1"),
      ]);

      expect(ids(result)).toEqual(["anexo-1", "sep-tab-1"]);
    });

    it("preserves order and identity of every surviving element", () => {
      const elements = [
        createElement("cap-1", [], "Capítulo"),
        createElement("art-1"),
        revoked("art-2"),
        createElement("art-3", [{ type: "Nova redação", date: "01.01.2022" }]),
      ];

      const result = processElementsForConsolidated(elements);

      expect(ids(result)).toEqual(["cap-1", "art-1", "sep-art-2", "art-3"]);
      expect(result[0]).toBe(elements[0]);
      expect(result[1]).toBe(elements[1]);
      expect(result[3]).toBe(elements[3]);
    });

    it("is idempotent: separators are active elements and survive a second pass unchanged", () => {
      const elements = [
        createElement("cap-1", [], "Capítulo"),
        createElement("art-1"),
        revoked("art-2"),
        createElement("art-3"),
        revoked("art-4"),
      ];

      const once = processElementsForConsolidated(elements);
      const twice = processElementsForConsolidated(once);

      expect(ids(once)).toEqual([
        "cap-1",
        "art-1",
        "sep-art-2",
        "art-3",
        "sep-art-4",
      ]);
      expect(twice).toEqual(once);
    });

    it("also drops elements expired by their own end of validity", () => {
      const result = processElementsForConsolidated([
        createElement("art-1"),
        createElement("art-2", [], "Artigo", {
          originalEndValidity: { date: YESTERDAY, deviceId: "Lei 2" },
        }),
        createElement("art-3", [], "Artigo", {
          originalEndValidity: { date: TOMORROW, deviceId: "Lei 2" },
        }),
      ]);

      expect(ids(result)).toEqual(["art-1", "sep-art-2", "art-3"]);
    });

    it("lets a duplicated id contaminate the status of its twin (status map is keyed by id)", () => {
      const result = processElementsForConsolidated([
        createElement("dup"),
        revoked("dup"),
        createElement("art-2"),
      ]);

      // Both entries share the "revoked" status computed last for id 'dup'.
      expect(ids(result)).toEqual(["sep-dup", "art-2"]);
    });
  });
});
