import { describe, expect, it } from "vitest";
import type { SpecialSituation } from "../../../domain/types";
import {
  SITUATION_TYPE_CONFIG,
  SITUATION_TYPE_OPTION_GROUPS,
  buildSituationFromDraft,
  canMarkSourceTrechos,
  getSituationTypeConfig,
  isRevocationLikeSituation,
  isSituationDraftValid,
  pruneSituationDraftForType,
  upsertSituation,
  withDerivedExcerpt,
} from "../situation-config";

describe("SITUATION_TYPE_CONFIG", () => {
  it("covers every situation type", () => {
    const types = Object.keys(SITUATION_TYPE_CONFIG);

    expect(types).toContain("Veto");
    expect(types).toContain("Renumeração");
    expect(types).toContain("Vigência final alterada");
    expect(types.length).toBe(17);
  });

  it("gives the revocation-like types the same shape as a veto", () => {
    const veto = getSituationTypeConfig("Veto");
    const revocation = getSituationTypeConfig("Revogação");

    expect(veto.supportsTrechos).toBe(true);
    expect(revocation.supportsTrechos).toBe(true);
    expect(revocation.excerptField).toBe("revokedText");
    expect(isRevocationLikeSituation("Cassação")).toBe(true);
    expect(isRevocationLikeSituation("Veto")).toBe(false);
  });

  it("uses the veto placeholder for omitted passages", () => {
    expect(getSituationTypeConfig("Veto").omissionPlaceholder).toBe("(VETADO)");
    expect(getSituationTypeConfig("Revogação").omissionPlaceholder).toBe(
      "[...]",
    );
  });

  it("groups the options for the picker without losing any type", () => {
    const grouped = SITUATION_TYPE_OPTION_GROUPS.flatMap(
      (group) => group.types,
    );

    expect(grouped.sort()).toEqual(Object.keys(SITUATION_TYPE_CONFIG).sort());
    expect(
      SITUATION_TYPE_OPTION_GROUPS.every((group) => group.label.length > 0),
    ).toBe(true);
  });
});

describe("pruneSituationDraftForType", () => {
  const vetoDraft: Partial<SpecialSituation> = {
    type: "Veto",
    date: "01.01.2020",
    vetoText: "trecho vetado",
    trechos: [{ start: 0, end: 5, type: "omission", selectedText: "trech" }],
    relatedDeviceId: "el-9",
    dispositivo: "Art. 3º",
  };

  it("keeps the shared fields when the type changes", () => {
    const pruned = pruneSituationDraftForType(vetoDraft, "Renumeração");

    expect(pruned.date).toBe("01.01.2020");
    expect(pruned.relatedDeviceId).toBe("el-9");
    expect(pruned.dispositivo).toBe("Art. 3º");
  });

  it("drops fields that no longer apply", () => {
    const pruned = pruneSituationDraftForType(vetoDraft, "Renumeração");

    expect(pruned.vetoText).toBeUndefined();
    expect(pruned.trechos).toBeUndefined();
  });

  it("moves the excerpt to the right field between passage types", () => {
    const pruned = pruneSituationDraftForType(vetoDraft, "Revogação");

    expect(pruned.vetoText).toBeUndefined();
    expect(pruned.trechos).toHaveLength(1);
  });

  it("keeps the replacement text only for new-text types", () => {
    const withText: Partial<SpecialSituation> = {
      type: "Nova redação",
      newText: "novo",
    };

    expect(pruneSituationDraftForType(withText, "Acréscimo").newText).toBe(
      "novo",
    );
    expect(
      pruneSituationDraftForType(withText, "Veto").newText,
    ).toBeUndefined();
  });
});

describe("withDerivedExcerpt", () => {
  it("writes the excerpt into the field of the type", () => {
    const derived = withDerivedExcerpt({
      type: "Veto",
      trechos: [
        { start: 0, end: 6, type: "omission", selectedText: "trecho" },
        { start: 20, end: 26, type: "omission", selectedText: "outro" },
      ],
    });

    expect(derived.vetoText).toBe("trecho [...] outro");
    expect(derived.revokedText).toBeUndefined();
  });

  it("clears the excerpt when every passage is removed", () => {
    const derived = withDerivedExcerpt({
      type: "Veto",
      vetoText: "sobra antiga",
      trechos: [],
    });

    expect(derived.vetoText).toBeUndefined();
  });

  it("appends the note of a supplemented passage", () => {
    const derived = withDerivedExcerpt({
      type: "Revogação",
      trechos: [
        {
          start: 0,
          end: 6,
          type: "supplement",
          selectedText: "trecho",
          supplementText: "15,4m",
        },
      ],
    });

    expect(derived.revokedText).toBe("trecho [15,4m]");
  });

  it("leaves types without passages untouched", () => {
    const draft: Partial<SpecialSituation> = {
      type: "Renumeração",
      newIndex: "4º",
    };

    expect(withDerivedExcerpt(draft)).toEqual(draft);
  });
});

describe("buildSituationFromDraft", () => {
  it("fills the legacy compatibility fields", () => {
    const situation = buildSituationFromDraft({
      type: "Veto",
      relatedDeviceId: "el-1",
      dispositivo: "Art. 1º",
    });

    expect(situation.normativeElementId).toBe("el-1");
    expect(situation.device).toBe("Art. 1º");
  });
});

describe("canMarkSourceTrechos", () => {
  it("requires a linked device", () => {
    expect(canMarkSourceTrechos({ type: "Veto" })).toBe(false);
    expect(canMarkSourceTrechos({ type: "Veto", relatedDeviceId: "   " })).toBe(
      false,
    );
    expect(
      canMarkSourceTrechos({ type: "Veto", relatedDeviceId: "el-9" }),
    ).toBe(true);
  });

  it("is available for a veto, not only for ementa changes", () => {
    expect(
      canMarkSourceTrechos({ type: "Veto", relatedDeviceId: "el-9" }),
    ).toBe(true);
    expect(
      canMarkSourceTrechos({
        type: "Derrubada de veto",
        relatedDeviceId: "el-9",
      }),
    ).toBe(true);
  });
});

describe("source passages", () => {
  const draft: Partial<SpecialSituation> = {
    type: "Veto",
    relatedDeviceId: "el-9",
    sourceTrechos: [
      { start: 0, end: 6, type: "omission", selectedText: "trecho" },
      { start: 20, end: 26, type: "omission", selectedText: "outro" },
    ],
    trechos: [{ start: 0, end: 4, type: "omission", selectedText: "alvo" }],
  };

  it("holds several passages of the source act", () => {
    expect(draft.sourceTrechos).toHaveLength(2);
  });

  it("keeps them when the type changes", () => {
    expect(
      pruneSituationDraftForType(draft, "Derrubada de veto").sourceTrechos,
    ).toHaveLength(2);
  });

  it("keeps them even for a type without target passages", () => {
    const pruned = pruneSituationDraftForType(draft, "Renumeração");

    expect(pruned.trechos).toBeUndefined();
    expect(pruned.sourceTrechos).toHaveLength(2);
  });

  it("does not leak into the excerpt of the affected element", () => {
    expect(withDerivedExcerpt(draft).vetoText).toBe("alvo");
  });

  it("survives a round trip through buildSituationFromDraft", () => {
    expect(buildSituationFromDraft(draft).sourceTrechos).toHaveLength(2);
  });
});

describe("isSituationDraftValid", () => {
  it("returns false if type is missing", () => {
    expect(isSituationDraftValid({})).toBe(false);
  });

  it("returns false if no normative element is linked", () => {
    expect(isSituationDraftValid({ type: "Veto" })).toBe(false);
    expect(
      isSituationDraftValid({ type: "Veto", relatedDeviceId: "   " }),
    ).toBe(false);
  });

  it("returns true when a normative element or device is linked", () => {
    expect(
      isSituationDraftValid({ type: "Veto", relatedDeviceId: "el-1" }),
    ).toBe(true);
    expect(
      isSituationDraftValid({ type: "Revogação", normativeElementId: "el-2" }),
    ).toBe(true);
    expect(
      isSituationDraftValid({ type: "Nova redação", sourceDocumentId: "doc-1" }),
    ).toBe(true);
  });
});

describe("upsertSituation", () => {
  const existing: SpecialSituation[] = [
    { type: "Veto", date: "01.01.2020" },
    { type: "Derrubada de veto", date: "01.01.2021" },
  ];

  it("appends when not editing", () => {
    const result = upsertSituation(existing, { type: "Revogação" }, null);

    expect(result).toHaveLength(3);
    expect(result[2].type).toBe("Revogação");
  });

  it("replaces in place when editing", () => {
    const result = upsertSituation(existing, { type: "Cassação" }, 0);

    expect(result).toHaveLength(2);
    expect(result[0].type).toBe("Cassação");
    expect(result[1].type).toBe("Derrubada de veto");
  });

  it("does not mutate the original list", () => {
    upsertSituation(existing, { type: "Cassação" }, 0);

    expect(existing[0].type).toBe("Veto");
  });

  it("appends instead of corrupting the list on an out-of-range index", () => {
    const result = upsertSituation(existing, { type: "Anulação" }, 9);

    expect(result).toHaveLength(3);
    expect(result[2].type).toBe("Anulação");
  });

  it("handles an undefined list", () => {
    expect(upsertSituation(undefined, { type: "Veto" }, null)).toHaveLength(1);
  });
});
