import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  GROUP_TITLES,
  NEW_TEXT_SITUATION_TYPES,
  SITUATION_TYPE_MAP,
  getEffectiveValidityDates,
  getElementStyle,
  getElementValiditySummary,
  getIconForType,
  getSituationNewTextLabel,
  groupSituationsForElement,
  isNewTextSituationType,
  isValidityEnded,
  isValidityNotStarted,
  parseDate,
  type SituationGroupType,
} from "../SituationLogic";
import { SITUATION_TYPE_CONFIG } from "../../inspector/situation-config";
import type {
  NormativeElementEntity,
  SpecialSituation,
  SpecialSituationType,
} from "../../../domain/entities";

/**
 * Grouping and typographic effect of every special situation type.
 *
 * `SituationLogic` decides two things the reader sees directly: which card a
 * situation lands in, and how the affected text is styled (struck through, red,
 * blue, orange, underlined). Both are driven by lookup tables and a chain of
 * `if`s, so a new type silently falls into "OTHER" with no styling unless it is
 * registered — which is exactly what these tests prevent.
 *
 * The clock is frozen so that "past" stays past and "future" stays future.
 */

const NOW = new Date("2024-06-15T12:00:00.000Z");
const PAST = "01.01.2021";
const FUTURE = "01.01.2030";

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterAll(() => {
  vi.useRealTimers();
});

const ALL_TYPES = Object.keys(SITUATION_TYPE_CONFIG) as SpecialSituationType[];

function makeElement(
  situations: SpecialSituation[] = [],
  overrides: Partial<NormativeElementEntity> = {},
): NormativeElementEntity {
  return {
    id: "art-1",
    type: "Artigo",
    index: "1º",
    text: "Fica instituído o programa municipal.",
    specialSituations: situations,
    originalStartValidity: { date: "01.01.2020", deviceId: "" },
    ...overrides,
  } as NormativeElementEntity;
}

/* -------------------------------------------------------------------------- */
/* Grouping                                                                    */
/* -------------------------------------------------------------------------- */

describe("every type is assigned to a card", () => {
  it('maps all 17 types, so none silently falls into "OTHER"', () => {
    const unmapped = ALL_TYPES.filter((type) => !SITUATION_TYPE_MAP[type]);

    expect(unmapped).toEqual([]);
    expect(ALL_TYPES).toHaveLength(17);
  });

  it("groups the types the way a reader thinks about them", () => {
    const byGroup: Record<string, string[]> = {};
    ALL_TYPES.forEach((type) => {
      const group = SITUATION_TYPE_MAP[type];
      byGroup[group] = [...(byGroup[group] ?? []), type].sort();
    });

    expect(byGroup).toEqual({
      VETO_GROUP: ["Derrubada de veto", "Veto"],
      ALTERATION_GROUP: ["Alteração de ementa", "Nova redação", "Renumeração"],
      VIGOR_GROUP: [
        "Perda definitiva de vigor/eficácia",
        "Restauração de vigor/eficácia",
        "Suspensão de vigor/eficácia",
      ],
      EXISTENCE_GROUP: [
        "Acréscimo",
        "Anulação",
        "Cassação",
        "Repristinação",
        "Revogação",
      ],
      INTERPRETATION_GROUP: [
        "Declaração de inconstitucionalidade sem redução de texto",
        "Interpretação conforme à Constituição",
      ],
      VALIDITY_GROUP: ["Vigência final alterada", "Vigência inicial alterada"],
    });
  });

  it('still maps the legacy "Extinção" of older records', () => {
    // Dropped from the union but kept in the table: records saved before the
    // type was split into Revogação/Anulação/Cassação still carry it.
    expect(SITUATION_TYPE_MAP["Extinção"]).toBe("EXISTENCE_GROUP");
  });

  it("titles every group, including the catch-all", () => {
    const groups: SituationGroupType[] = [
      ...new Set(Object.values(SITUATION_TYPE_MAP)),
      "OTHER",
    ];

    groups.forEach((group) => {
      expect(GROUP_TITLES[group]).toBeTruthy();
      // The title must read as a subject, not as an internal identifier.
      expect(GROUP_TITLES[group]).not.toMatch(/_/);
    });
  });

  it('falls back to "OTHER" for a type that is not in the table', () => {
    const groups = groupSituationsForElement(
      makeElement([
        { type: "Tipo desconhecido" as SpecialSituationType, date: PAST },
      ]),
    );

    expect(groups).toHaveLength(1);
    expect(groups[0].type).toBe("OTHER");
    expect(GROUP_TITLES.OTHER).toBe("Outras situações");
  });

  it("gives each group its own icon", () => {
    const groups: SituationGroupType[] = [
      "VETO_GROUP",
      "ALTERATION_GROUP",
      "VIGOR_GROUP",
      "EXISTENCE_GROUP",
      "INTERPRETATION_GROUP",
      "VALIDITY_GROUP",
      "OTHER",
    ];

    const icons = groups.map((group) => getIconForType(group));

    expect(icons.every(Boolean)).toBe(true);
    // Two groups sharing an icon would make the cards indistinguishable.
    expect(new Set(icons.map((icon) => icon.type)).size).toBe(groups.length);
  });

  it("carries the element reference on every group it builds", () => {
    const element = makeElement([{ type: "Veto", date: PAST }], {
      id: "par-2",
      type: "Parágrafo",
      index: "2º",
    });

    const [group] = groupSituationsForElement(element);

    expect(group.id).toBe("par-2-VETO_GROUP");
    expect(group.elementId).toBe("par-2");
    expect(group.elementKey).toBe("Parágrafo 2º");
  });

  it("builds no group for an element with no situations", () => {
    expect(groupSituationsForElement(makeElement([]))).toEqual([]);
    expect(
      groupSituationsForElement(
        makeElement(undefined as unknown as SpecialSituation[]),
      ),
    ).toEqual([]);
  });

  it("keeps one group per subject when an element accumulated many situations", () => {
    const groups = groupSituationsForElement(
      makeElement([
        { type: "Veto", date: "01.01.2021" },
        { type: "Derrubada de veto", date: "01.02.2021" },
        { type: "Nova redação", date: "01.03.2021" },
        { type: "Revogação", date: "01.04.2021" },
        { type: "Interpretação conforme à Constituição", date: "01.05.2021" },
        { type: "Vigência final alterada", date: "01.06.2021" },
        { type: "Suspensão de vigor/eficácia", date: "01.07.2021" },
      ]),
    );

    // Newest group first, so the most recent change to the device leads.
    expect(groups.map((group) => group.type)).toEqual([
      "VIGOR_GROUP",
      "VALIDITY_GROUP",
      "INTERPRETATION_GROUP",
      "EXISTENCE_GROUP",
      "ALTERATION_GROUP",
      "VETO_GROUP",
    ]);
    expect(groups[0].latestDate).toEqual(parseDate("01.07.2021"));
  });

  it("sorts an undated situation last inside its group", () => {
    const [group] = groupSituationsForElement(
      makeElement([{ type: "Veto" }, { type: "Veto", date: "01.01.2021" }]),
    );

    // An undated record parses to the epoch, so it reads as the oldest and comes first in chronological order.
    expect(group.situations.map((situation) => situation.date)).toEqual([
      undefined,
      "01.01.2021",
    ]);
  });
});

/* -------------------------------------------------------------------------- */
/* Dates                                                                       */
/* -------------------------------------------------------------------------- */

describe("parseDate", () => {
  it("reads the Legis date format", () => {
    const parsed = parseDate("22.03.2016");

    expect(parsed.getFullYear()).toBe(2016);
    expect(parsed.getMonth()).toBe(2);
    expect(parsed.getDate()).toBe(22);
  });

  it("treats anything it cannot read as the epoch", () => {
    // Sorting must never throw on a half-filled record, so every unreadable
    // date collapses to the oldest possible one.
    expect(parseDate(undefined).getTime()).toBe(0);
    expect(parseDate("").getTime()).toBe(0);
    expect(parseDate("vigência condicionada").getTime()).toBe(0);
    expect(parseDate("não informado").getTime()).toBe(0);
    expect(parseDate("2016-03-22").getTime()).toBe(0);
  });
});

/* -------------------------------------------------------------------------- */
/* Typographic effect, one case per type                                       */
/* -------------------------------------------------------------------------- */

type Style = ReturnType<typeof getElementStyle>;

/**
 * How a single past-dated situation of each type styles the affected text.
 * Struck through = the text lost its reach; red = not in force yet; blue = new
 * text in force; orange = in force but disputed; underline = reading fixed.
 */
const STYLE_BY_TYPE: Record<SpecialSituationType, Style> = {
  Veto: { textDecoration: "line-through" },
  Revogação: { textDecoration: "line-through" },
  Anulação: { textDecoration: "line-through" },
  Cassação: { textDecoration: "line-through" },
  "Perda definitiva de vigor/eficácia": { textDecoration: "line-through" },
  "Suspensão de vigor/eficácia": { textDecoration: "line-through" },
  // The device's own end of validity was brought forward to a past date.
  "Vigência final alterada": { textDecoration: "line-through" },

  "Nova redação": { color: "blue", fontWeight: "bold" },
  Acréscimo: { color: "blue", fontWeight: "bold" },
  Renumeração: { color: "blue", fontWeight: "bold" },
  "Alteração de ementa": { color: "blue", fontWeight: "bold" },

  "Derrubada de veto": { color: "orange" },
  Repristinação: { color: "orange" },
  "Restauração de vigor/eficácia": { color: "orange" },

  "Interpretação conforme à Constituição": { textDecoration: "underline" },
  "Declaração de inconstitucionalidade sem redução de texto": {
    textDecoration: "underline",
  },

  // Already in force at a past date: nothing to signal.
  "Vigência inicial alterada": {},
};

describe("getElementStyle, per type", () => {
  it.each(ALL_TYPES)("%s", (type) => {
    expect(getElementStyle(makeElement([{ type, date: PAST }]))).toEqual(
      STYLE_BY_TYPE[type],
    );
  });

  it("leaves an untouched device unstyled", () => {
    expect(getElementStyle(makeElement([]))).toEqual({});
  });

  it("leaves an unknown type unstyled instead of guessing", () => {
    expect(
      getElementStyle(
        makeElement([
          { type: "Tipo desconhecido" as SpecialSituationType, date: PAST },
        ]),
      ),
    ).toEqual({});
  });

  it("tolerates an element with no situations array", () => {
    expect(
      getElementStyle(makeElement(undefined as unknown as SpecialSituation[])),
    ).toEqual({});
  });
});

describe("getElementStyle, when situations contradict each other", () => {
  it("does not strike a veto that was overturned", () => {
    expect(
      getElementStyle(
        makeElement([
          { type: "Veto", date: "01.01.2021" },
          { type: "Derrubada de veto", date: "01.02.2021" },
        ]),
      ),
    ).toEqual({ color: "orange" });
  });

  it("keeps striking a veto that a repristination cannot undo", () => {
    // Only a "Derrubada de veto" answers a veto. A repristination is about
    // revocation, so the vetoed text stays struck.
    expect(
      getElementStyle(
        makeElement([
          { type: "Veto", date: "01.01.2021" },
          { type: "Repristinação", date: "01.02.2021" },
        ]),
      ),
    ).toEqual({ textDecoration: "line-through" });
  });

  it("does not strike a revocation that was repristinated", () => {
    expect(
      getElementStyle(
        makeElement([
          { type: "Revogação", date: "01.01.2021" },
          { type: "Repristinação", date: "01.02.2021" },
        ]),
      ),
    ).toEqual({ color: "orange" });
  });

  it("does not strike a suspension whose validity was restored", () => {
    expect(
      getElementStyle(
        makeElement([
          { type: "Suspensão de vigor/eficácia", date: "01.01.2021" },
          { type: "Restauração de vigor/eficácia", date: "01.02.2021" },
        ]),
      ),
    ).toEqual({ color: "orange" });
  });

  it("keeps striking a revocation whose repristination has not arrived yet", () => {
    expect(
      getElementStyle(
        makeElement([
          { type: "Revogação", date: "01.01.2021" },
          { type: "Repristinação", date: FUTURE },
        ]),
      ),
    ).toEqual({ textDecoration: "line-through" });
  });

  it("ignores the order in which a revocation and its repristination were saved", () => {
    const forwards = getElementStyle(
      makeElement([
        { type: "Revogação", date: "01.01.2021" },
        { type: "Repristinação", date: "01.02.2021" },
      ]),
    );
    const backwards = getElementStyle(
      makeElement([
        { type: "Repristinação", date: "01.02.2021" },
        { type: "Revogação", date: "01.01.2021" },
      ]),
    );

    expect(forwards).toEqual(backwards);
  });

  it("lets a not-yet-in-force device win over every other signal", () => {
    // Red comes first: a device that is not in force yet must not be read as
    // if its revocation or new wording already applied.
    expect(
      getElementStyle(
        makeElement([
          { type: "Vigência inicial alterada", date: FUTURE },
          { type: "Revogação", date: "01.01.2021" },
          { type: "Nova redação", date: "01.01.2021" },
        ]),
      ),
    ).toEqual({ color: "red" });
  });

  it("keeps blue styling struck through for new text when revoked", () => {
    expect(
      getElementStyle(
        makeElement([
          { type: "Nova redação", date: "01.01.2021" },
          { type: "Revogação", date: "01.02.2021" },
        ]),
      ),
    ).toEqual({
      color: "blue",
      textDecoration: "line-through",
      fontWeight: "bold",
    });
  });

  it("prefers new text over a disputed reading", () => {
    expect(
      getElementStyle(
        makeElement([
          { type: "Nova redação", date: "01.01.2021" },
          { type: "Derrubada de veto", date: "01.02.2021" },
        ]),
      ),
    ).toEqual({ color: "blue", fontWeight: "bold" });
  });

  it("prefers a disputed reading over a fixed interpretation", () => {
    expect(
      getElementStyle(
        makeElement([
          { type: "Repristinação", date: "01.01.2021" },
          { type: "Interpretação conforme à Constituição", date: "01.02.2021" },
        ]),
      ),
    ).toEqual({ color: "orange" });
  });

  it("strikes a device whose own validity already ended", () => {
    expect(getElementStyle(makeElement([]), { date: "01.01.2022" })).toEqual({
      textDecoration: "line-through",
    });
  });

  it("renders red without strike-through when a revocation is not yet in force (future)", () => {
    expect(
      getElementStyle(makeElement([{ type: "Revogação", date: FUTURE }])),
    ).toEqual({ color: "red" });
  });

  it("documents that a conditional revocation also strikes the text", () => {
    expect(
      getElementStyle(
        makeElement([{ type: "Revogação", date: "vigência condicionada" }]),
      ),
    ).toEqual({ textDecoration: "line-through" });
  });
});

/* -------------------------------------------------------------------------- */
/* Validity                                                                    */
/* -------------------------------------------------------------------------- */

describe("isValidityNotStarted", () => {
  it("is true for a start date still ahead", () => {
    expect(
      isValidityNotStarted(
        makeElement([], {
          originalStartValidity: { date: FUTURE, deviceId: "" },
        }),
      ),
    ).toBe(true);
  });

  it("is false for a start date already past", () => {
    expect(isValidityNotStarted(makeElement([]))).toBe(false);
  });

  it("is true while the start remains conditional", () => {
    expect(
      isValidityNotStarted(
        makeElement([], {
          originalStartValidity: {
            date: "vigência condicionada",
            deviceId: "",
          },
        }),
      ),
    ).toBe(true);
  });

  it("lets a change of initial validity override the original date", () => {
    expect(
      isValidityNotStarted(
        makeElement([{ type: "Vigência inicial alterada", date: FUTURE }]),
      ),
    ).toBe(true);
  });

  it("brings a device forward when the change moved the start into the past", () => {
    expect(
      isValidityNotStarted(
        makeElement([{ type: "Vigência inicial alterada", date: PAST }], {
          originalStartValidity: { date: FUTURE, deviceId: "" },
        }),
      ),
    ).toBe(false);
  });

  it("uses the most recent change when several were recorded", () => {
    expect(
      isValidityNotStarted(
        makeElement([
          { type: "Vigência inicial alterada", date: PAST },
          { type: "Vigência inicial alterada", date: FUTURE },
        ]),
      ),
    ).toBe(true);
  });
});

describe("isValidityEnded", () => {
  it("is false when no end was ever recorded", () => {
    expect(isValidityEnded(makeElement([]))).toBe(false);
  });

  it("is true for an end date already past", () => {
    expect(isValidityEnded(makeElement([]), { date: PAST })).toBe(true);
  });

  it("is false for an end date still ahead", () => {
    expect(isValidityEnded(makeElement([]), { date: FUTURE })).toBe(false);
  });

  it("is true while the end remains conditional", () => {
    expect(
      isValidityEnded(makeElement([]), { date: "vigência condicionada" }),
    ).toBe(true);
  });

  it("lets a change of final validity override the document end", () => {
    expect(
      isValidityEnded(
        makeElement([{ type: "Vigência final alterada", date: FUTURE }]),
        { date: PAST },
      ),
    ).toBe(false);
  });

  it("uses the most recent change when several were recorded", () => {
    expect(
      isValidityEnded(
        makeElement([
          { type: "Vigência final alterada", date: FUTURE },
          { type: "Vigência final alterada", date: PAST },
        ]),
      ),
    ).toBe(false);
  });
});

describe("getEffectiveValidityDates", () => {
  it("returns the original dates when nothing changed them", () => {
    const dates = getEffectiveValidityDates(
      makeElement([], {
        originalEndValidity: { date: "31.12.2030", deviceId: "" },
      }),
    );

    expect(dates.startDate).toBe("01.01.2020");
    expect(dates.endDate).toBe("31.12.2030");
    expect(dates.latestStartAlteration).toBeUndefined();
    expect(dates.latestEndAlteration).toBeUndefined();
  });

  it("prefers the most recent change over the original dates", () => {
    const dates = getEffectiveValidityDates(
      makeElement([
        { type: "Vigência inicial alterada", date: "01.01.2021" },
        { type: "Vigência inicial alterada", date: "01.01.2022" },
        { type: "Vigência final alterada", date: "31.12.2025" },
      ]),
    );

    expect(dates.startDate).toBe("01.01.2022");
    expect(dates.endDate).toBe("31.12.2025");
    expect(dates.latestStartAlteration?.date).toBe("01.01.2022");
    expect(dates.latestEndAlteration?.date).toBe("31.12.2025");
  });

  it("prefers the end of the whole document over the end of the element", () => {
    const dates = getEffectiveValidityDates(
      makeElement([], {
        originalEndValidity: { date: "31.12.2030", deviceId: "" },
      }),
      { date: "31.12.2025" },
    );

    expect(dates.endDate).toBe("31.12.2025");
  });

  it("ignores changes of a different kind", () => {
    const dates = getEffectiveValidityDates(
      makeElement([
        { type: "Nova redação", date: "01.01.2022" },
        { type: "Revogação", date: "01.01.2023" },
      ]),
    );

    expect(dates.startDate).toBe("01.01.2020");
    expect(dates.endDate).toBeUndefined();
  });
});

describe("getElementValiditySummary", () => {
  it("says nothing when no date is known", () => {
    expect(
      getElementValiditySummary(
        makeElement([], {
          originalStartValidity: undefined,
        }),
      ),
    ).toBeNull();
  });

  it("reads an open-ended validity as a starting point", () => {
    expect(getElementValiditySummary(makeElement([]))).toBe(
      "Vigência: a partir de 01.01.2020",
    );
  });

  it("reads a closed interval", () => {
    expect(
      getElementValiditySummary(makeElement([]), { date: "31.12.2030" }),
    ).toBe("Vigência: de 01.01.2020 até 31.12.2030");
  });

  it("reads an end without a start as a deadline", () => {
    expect(
      getElementValiditySummary(
        makeElement([], { originalStartValidity: undefined }),
        { date: "31.12.2030" },
      ),
    ).toBe("Vigência: até 31.12.2030");
  });

  it("names a conditional start without inventing a date", () => {
    expect(
      getElementValiditySummary(
        makeElement([], {
          originalStartValidity: {
            date: "vigência condicionada",
            deviceId: "",
          },
        }),
      ),
    ).toBe("Vigência condicionada · suspensa por vigência inicial");
  });

  it("warns that a device is not in force yet", () => {
    expect(
      getElementValiditySummary(
        makeElement([], {
          originalStartValidity: { date: FUTURE, deviceId: "" },
        }),
      ),
    ).toBe("Vigência: a partir de 01.01.2030 · suspensa por vigência inicial");
  });

  it("warns that a device is no longer in force", () => {
    expect(getElementValiditySummary(makeElement([]), { date: PAST })).toBe(
      "Vigência: de 01.01.2020 até 01.01.2021 · suspensa por vigência final",
    );
  });

  it("reports the start first when a device is neither in force yet nor still", () => {
    expect(
      getElementValiditySummary(
        makeElement([], {
          originalStartValidity: { date: FUTURE, deviceId: "" },
        }),
        { date: PAST },
      ),
    ).toBe(
      "Vigência: de 01.01.2030 até 01.01.2021 · suspensa por vigência inicial",
    );
  });

  it("reflects a change of validity in the summary", () => {
    expect(
      getElementValiditySummary(
        makeElement([
          { type: "Vigência inicial alterada", date: "01.06.2022" },
        ]),
      ),
    ).toBe("Vigência: a partir de 01.06.2022");
  });

  it("keeps an unreadable date as it was stored, instead of showing an error", () => {
    expect(
      getElementValiditySummary(
        makeElement([], {
          originalStartValidity: { date: "31.31.2020", deviceId: "" },
        }),
      ),
    ).toBe("Vigência: a partir de 31.31.2020");
  });
});

/* -------------------------------------------------------------------------- */
/* New-text types                                                              */
/* -------------------------------------------------------------------------- */

describe("the types that carry a replacement text", () => {
  it("lists exactly the types whose situation replaces or adds wording", () => {
    expect([...NEW_TEXT_SITUATION_TYPES].sort()).toEqual([
      "Acréscimo",
      "Alteração de ementa",
      "Declaração de inconstitucionalidade sem redução de texto",
      "Interpretação conforme à Constituição",
      "Nova redação",
      "Repristinação",
    ]);
  });

  it("recognises each of them, and nothing else", () => {
    const recognised = ALL_TYPES.filter((type) =>
      isNewTextSituationType(type),
    ).sort();

    expect(recognised).toEqual([...NEW_TEXT_SITUATION_TYPES].sort());
  });

  it("rejects a missing or unknown type", () => {
    expect(isNewTextSituationType(undefined)).toBe(false);
    expect(isNewTextSituationType("")).toBe(false);
    expect(isNewTextSituationType("Veto")).toBe(false);
  });

  it("labels the replacement text of each type", () => {
    expect(
      NEW_TEXT_SITUATION_TYPES.map((type) => getSituationNewTextLabel(type)),
    ).toEqual([
      "Nova redação",
      "Ementa alterada",
      "Texto acrescido",
      "Texto com interpretação fixada",
      "Texto com declaração de inconstitucionalidade",
      "Texto restaurado",
    ]);
  });

  it('falls back to "Nova redação" for a type with no label of its own', () => {
    expect(getSituationNewTextLabel(undefined)).toBe("Nova redação");
    expect(getSituationNewTextLabel("Veto")).toBe("Nova redação");
  });
});
