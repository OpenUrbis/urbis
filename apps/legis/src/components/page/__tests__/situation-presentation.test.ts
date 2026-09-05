import { describe, expect, it } from "vitest";
import type {
  SpecialSituation,
  SpecialSituationType,
} from "../../../domain/types";
import { SITUATION_TYPE_CONFIG } from "../../inspector/situation-config";
import {
  getSituationPresentation,
  type SituationTone,
} from "../situation-presentation";

/**
 * Exhaustive coverage of the reader-facing meaning of every special situation.
 *
 * `situation-presentation.ts` is what stands between the persisted data model and
 * the reading view: it decides the tone, the plain-language sentence, whether a
 * quoted passage is shown and how the origin act is referenced. A regression here
 * is silent — the card still renders, it just says the wrong thing about the law.
 *
 * The table below is checked against `SITUATION_TYPE_CONFIG`, the single runtime
 * list of the 17 types, so adding an 18th type fails this suite until its reading
 * behaviour is decided on purpose.
 */

interface TypeExpectation {
  tone: SituationTone;
  /** Sentence used when the situation hits the whole device. */
  whole: string;
  /** Sentence used when only a passage is affected, when the type supports it. */
  partial?: string;
  /** Caption of the quoted passage, when the type quotes anything at all. */
  excerptLabel?: string;
  /** Whether the quoted passage is rendered struck through. */
  struck?: boolean;
}

const EXPECTATIONS: Record<SpecialSituationType, TypeExpectation> = {
  Veto: {
    tone: "negative",
    whole: "Todo o dispositivo foi vetado.",
    partial: "Veto parcial: o trecho abaixo foi vetado.",
    excerptLabel: "Trecho vetado",
    struck: true,
  },
  "Derrubada de veto": {
    tone: "positive",
    whole: "O veto foi derrubado e o dispositivo voltou a vigorar.",
    partial:
      "O veto foi derrubado quanto ao trecho abaixo, que voltou a vigorar.",
    excerptLabel: "Trecho com veto derrubado",
  },
  "Perda definitiva de vigor/eficácia": {
    tone: "negative",
    whole: "Todo o dispositivo perdeu vigor/eficácia em definitivo.",
    partial: "O trecho abaixo perdeu vigor/eficácia em definitivo.",
    excerptLabel: "Trecho sem vigor/eficácia",
    struck: true,
  },
  "Suspensão de vigor/eficácia": {
    tone: "negative",
    whole: "Todo o dispositivo está com vigor/eficácia suspenso.",
    partial: "O trecho abaixo está com vigor/eficácia suspenso.",
    excerptLabel: "Trecho suspenso",
    struck: true,
  },
  Revogação: {
    tone: "negative",
    whole: "Todo o dispositivo foi revogado.",
    partial: "O trecho abaixo foi revogado.",
    excerptLabel: "Trecho revogado",
    struck: true,
  },
  Anulação: {
    tone: "negative",
    whole: "Todo o dispositivo foi anulado.",
    partial: "O trecho abaixo foi anulado.",
    excerptLabel: "Trecho anulado",
    struck: true,
  },
  Cassação: {
    tone: "negative",
    whole: "Todo o dispositivo foi cassado.",
    partial: "O trecho abaixo foi cassado.",
    excerptLabel: "Trecho cassado",
    struck: true,
  },
  "Restauração de vigor/eficácia": {
    tone: "positive",
    whole: "O vigor/eficácia do dispositivo foi restaurado.",
    partial: "O vigor/eficácia do trecho abaixo foi restaurado.",
    excerptLabel: "Trecho restaurado",
  },
  Repristinação: {
    tone: "positive",
    whole: "O dispositivo foi repristinado e voltou a vigorar.",
    partial: "O trecho abaixo foi repristinado e voltou a vigorar.",
    excerptLabel: "Texto restaurado",
  },
  "Nova redação": {
    tone: "informative",
    whole: "O dispositivo recebeu nova redação.",
    excerptLabel: "Nova redação",
  },
  "Alteração de ementa": {
    tone: "informative",
    whole: "A ementa foi alterada.",
    excerptLabel: "Ementa alterada",
  },
  Acréscimo: {
    tone: "informative",
    whole: "Foi acrescido texto ao dispositivo.",
    excerptLabel: "Texto acrescido",
  },
  "Interpretação conforme à Constituição": {
    tone: "informative",
    whole: "Foi fixada interpretação conforme à Constituição.",
    excerptLabel: "Texto com interpretação fixada",
  },
  // Negative, not informative: the device stays in the text but loses reach.
  "Declaração de inconstitucionalidade sem redução de texto": {
    tone: "negative",
    whole: "Foi declarada a inconstitucionalidade, sem redução de texto.",
    excerptLabel: "Texto atingido",
  },
  Renumeração: {
    tone: "neutral",
    whole: "O dispositivo foi renumerado.",
  },
  "Vigência inicial alterada": {
    tone: "neutral",
    whole: "A vigência inicial deste dispositivo foi alterada.",
  },
  "Vigência final alterada": {
    tone: "neutral",
    whole: "A vigência final deste dispositivo foi alterada.",
  },
};

const ALL_TYPES = Object.keys(SITUATION_TYPE_CONFIG) as SpecialSituationType[];

/** The types whose copy distinguishes a partial situation from a whole one. */
const TYPES_WITH_PARTIAL_COPY = ALL_TYPES.filter(
  (type) => !!EXPECTATIONS[type].partial,
);

/** The types that never quote a passage, however much text the record carries. */
const TYPES_WITHOUT_EXCERPT = ALL_TYPES.filter(
  (type) => !EXPECTATIONS[type].excerptLabel,
);

/** A passage as the inspector persists it: offsets plus the exact selected text. */
function passage(
  selectedText: string,
  start = 0,
  end = 10,
): SpecialSituation["trechos"] {
  return [{ start, end, type: "omission", selectedText }];
}

describe("the table of expectations mirrors the runtime list of types", () => {
  it("describes every one of the 17 types, and no invented one", () => {
    expect(ALL_TYPES).toHaveLength(17);
    expect(Object.keys(EXPECTATIONS).sort()).toEqual([...ALL_TYPES].sort());
  });

  it("never falls back to the generic sentence for a known type", () => {
    const generic = ALL_TYPES.filter(
      (type) =>
        getSituationPresentation({ type }).effect ===
        "Situação especial registrada.",
    );

    expect(generic).toEqual([]);
  });

  it("states the official type name as the title, verbatim", () => {
    ALL_TYPES.forEach((type) => {
      expect(getSituationPresentation({ type }).title).toBe(type);
    });
  });
});

describe("per-type reading of a whole-device situation", () => {
  it.each(ALL_TYPES)("%s", (type) => {
    const expected = EXPECTATIONS[type];
    const presentation = getSituationPresentation({ type });

    expect(presentation.title).toBe(type);
    expect(presentation.tone).toBe(expected.tone);
    expect(presentation.effect).toBe(expected.whole);
    // Nothing to quote and nothing to add when the record carries only a type.
    expect(presentation.excerpt).toBeUndefined();
    expect(presentation.details).toEqual([]);
    expect(presentation.origin).toBeUndefined();
    expect(presentation.dateLabel).toBeUndefined();
  });
});

describe("tone", () => {
  const byTone = (tone: SituationTone) =>
    ALL_TYPES.filter(
      (type) => getSituationPresentation({ type }).tone === tone,
    ).sort();

  it("marks as negative every situation that takes reach away from the device", () => {
    expect(byTone("negative")).toEqual([
      "Anulação",
      "Cassação",
      "Declaração de inconstitucionalidade sem redução de texto",
      "Perda definitiva de vigor/eficácia",
      "Revogação",
      "Suspensão de vigor/eficácia",
      "Veto",
    ]);
  });

  it("marks as positive every situation that gives reach back", () => {
    expect(byTone("positive")).toEqual([
      "Derrubada de veto",
      "Repristinação",
      "Restauração de vigor/eficácia",
    ]);
  });

  it("marks as informative the situations that change the text without judging it", () => {
    expect(byTone("informative")).toEqual([
      "Acréscimo",
      "Alteração de ementa",
      "Interpretação conforme à Constituição",
      "Nova redação",
    ]);
  });

  it("leaves neutral what only moves or dates the device", () => {
    expect(byTone("neutral")).toEqual([
      "Renumeração",
      "Vigência final alterada",
      "Vigência inicial alterada",
    ]);
  });

  it("classifies an unknown type as neutral and describes it generically", () => {
    const presentation = getSituationPresentation({
      type: "Situação inexistente" as SpecialSituationType,
    });

    expect(presentation.tone).toBe("neutral");
    expect(presentation.effect).toBe("Situação especial registrada.");
    expect(presentation.title).toBe("Situação inexistente");
  });
});

describe("date label", () => {
  it('prefixes an ordinary date with "em"', () => {
    ALL_TYPES.filter((type) => !type.startsWith("Vigência")).forEach((type) => {
      expect(
        getSituationPresentation({ type, date: "22.03.2016" }).dateLabel,
      ).toBe("em 22.03.2016");
    });
  });

  it("reads a changed initial validity as a starting point", () => {
    expect(
      getSituationPresentation({
        type: "Vigência inicial alterada",
        date: "01.01.2020",
      }).dateLabel,
    ).toBe("a partir de 01.01.2020");
  });

  it("reads a changed final validity as a deadline", () => {
    expect(
      getSituationPresentation({
        type: "Vigência final alterada",
        date: "31.12.2020",
      }).dateLabel,
    ).toBe("até 31.12.2020");
  });

  it("keeps the conditional validity as a phrase, with no preposition", () => {
    ALL_TYPES.forEach((type) => {
      expect(
        getSituationPresentation({ type, date: "vigência condicionada" })
          .dateLabel,
      ).toBe("vigência condicionada");
    });
  });

  it("recognises the conditional validity even when the record is padded", () => {
    expect(
      getSituationPresentation({
        type: "Veto",
        date: "  vigência condicionada  ",
      }).dateLabel,
    ).toBe("vigência condicionada");
  });

  it("trims the date instead of printing the padding", () => {
    expect(
      getSituationPresentation({ type: "Veto", date: "  22.03.2016  " })
        .dateLabel,
    ).toBe("em 22.03.2016");
  });

  it("has no label at all when the date is missing or blank", () => {
    expect(
      getSituationPresentation({ type: "Veto" }).dateLabel,
    ).toBeUndefined();
    expect(
      getSituationPresentation({ type: "Veto", date: "" }).dateLabel,
    ).toBeUndefined();
    expect(
      getSituationPresentation({ type: "Veto", date: "   " }).dateLabel,
    ).toBeUndefined();
  });
});

describe("reader-specific presentation", () => {
  it("renders veto without the act date or redundant whole-device copy", () => {
    const presentation = getSituationPresentation(
      {
        type: "Veto",
        date: "19.03.2024",
        relatedDeviceId: "art-1",
        dispositivo: "Art. 1º",
      },
      undefined,
      { surface: "reader" },
    );

    expect(presentation.title).toBe("VETO");
    expect(presentation.dateLabel).toBeUndefined();
    expect(presentation.effect).toBe("");
    expect(presentation.originLabel).toBe("Dispositivo");
  });

  it("uses the affected element validity for a revocation card", () => {
    const presentation = getSituationPresentation(
      {
        type: "Revogação",
        date: "19.03.2024",
        relatedDeviceId: "art-1",
        dispositivo: "Art. 1º inteiro",
      },
      "19.03.2024",
      {
        surface: "reader",
        effectiveStartDate: "01.01.2020",
      },
    );

    expect(presentation.title).toBe("REVOGAÇÃO");
    expect(presentation.dateLabel).toBe("Início da vigência: 01.01.2020");
    expect(presentation.effect).toBe("");
    expect(presentation.originLabel).toBe("Dispositivo");

    const legacyFullDevice = getSituationPresentation(
      {
        type: "Revogação",
        revokedText: "texto completo do dispositivo",
      },
      undefined,
      { surface: "reader" },
    );
    expect(legacyFullDevice.excerpt?.label).toBe("Dispositivo revogado");
  });

  it("maps validity alteration types to reader status names", () => {
    expect(
      getSituationPresentation(
        { type: "Vigência inicial alterada", date: "01.01.2030" },
        undefined,
        { surface: "reader", effectiveStartDate: "01.01.2030" },
      ),
    ).toMatchObject({
      title: "VIGÊNCIA NÃO INICIADA",
      dateLabel: "Início da vigência: 01.01.2030",
    });

    expect(
      getSituationPresentation(
        { type: "Vigência final alterada", date: "01.01.2030" },
        undefined,
        { surface: "reader", effectiveEndDate: "01.01.2030" },
      ),
    ).toMatchObject({
      title: "VIGÊNCIA FINALIZADA",
      dateLabel: "Fim da vigência: 01.01.2030",
    });
  });
});

describe("partial versus whole", () => {
  it.each(TYPES_WITH_PARTIAL_COPY)(
    "%s switches to the partial sentence",
    (type) => {
      const presentation = getSituationPresentation({
        type,
        trechos: passage("a critério do órgão competente"),
      });

      expect(presentation.effect).toBe(EXPECTATIONS[type].partial);
      expect(presentation.effect).not.toBe(EXPECTATIONS[type].whole);
    },
  );

  it.each(ALL_TYPES.filter((type) => !EXPECTATIONS[type].partial))(
    "%s keeps the whole-device sentence, because a passage adds nothing to it",
    (type) => {
      const presentation = getSituationPresentation({
        type,
        trechos: passage("a critério do órgão competente"),
      });

      expect(presentation.effect).toBe(EXPECTATIONS[type].whole);
    },
  );

  it("stays whole when the legacy free text is filled but no passage is marked", () => {
    // Legacy records carried the affected text without offsets. Without
    // offsets there is no partial situation to speak of.
    const presentation = getSituationPresentation({
      type: "Revogação",
      revokedText: "a critério do órgão competente",
    });

    expect(presentation.effect).toBe("Todo o dispositivo foi revogado.");
    expect(presentation.excerpt?.text).toBe("a critério do órgão competente");
  });

  it("stays whole when the marked passage is degenerate and gets dropped", () => {
    // A zero-length passage is discarded by the normalizer, so the situation
    // must not be announced as partial.
    const presentation = getSituationPresentation({
      type: "Revogação",
      trechos: [{ start: 5, end: 5, selectedText: "nada" }],
    });

    expect(presentation.effect).toBe("Todo o dispositivo foi revogado.");
    expect(presentation.excerpt).toBeUndefined();
  });
});

describe("quoted passage", () => {
  it.each(ALL_TYPES.filter((type) => !!EXPECTATIONS[type].excerptLabel))(
    "%s captions and quotes the marked passage",
    (type) => {
      const expected = EXPECTATIONS[type];
      const presentation = getSituationPresentation({
        type,
        trechos: passage("mediante prévia autorização"),
      });

      expect(presentation.excerpt).toEqual({
        label: expected.excerptLabel,
        text: "mediante prévia autorização",
        struck: !!expected.struck,
      });
    },
  );

  it.each(TYPES_WITHOUT_EXCERPT)(
    "%s quotes nothing, even with text on every field",
    (type) => {
      const presentation = getSituationPresentation({
        type,
        trechos: passage("mediante prévia autorização"),
        vetoText: "texto vetado",
        revokedText: "texto revogado",
        newText: "texto novo",
        vetoOverturnedText: "texto restabelecido",
      });

      expect(presentation.excerpt).toBeUndefined();
    },
  );

  it("strikes through only what lost its reach", () => {
    const struck = ALL_TYPES.filter(
      (type) =>
        getSituationPresentation({ type, trechos: passage("x") }).excerpt
          ?.struck === true,
    ).sort();

    expect(struck).toEqual([
      "Anulação",
      "Cassação",
      "Perda definitiva de vigor/eficácia",
      "Revogação",
      "Suspensão de vigor/eficácia",
      "Veto",
    ]);
  });

  it("elides the gap between two marked passages", () => {
    const presentation = getSituationPresentation({
      type: "Veto",
      trechos: [
        { start: 0, end: 5, type: "omission", selectedText: "os arts. 3º" },
        { start: 20, end: 30, type: "omission", selectedText: "e 4º" },
      ],
    });

    expect(presentation.excerpt?.text).toBe("os arts. 3º [...] e 4º");
  });

  it("orders the passages by position, not by the order they were marked", () => {
    const presentation = getSituationPresentation({
      type: "Veto",
      trechos: [
        { start: 30, end: 40, type: "omission", selectedText: "segundo" },
        { start: 0, end: 10, type: "omission", selectedText: "primeiro" },
      ],
    });

    expect(presentation.excerpt?.text).toBe("primeiro [...] segundo");
  });

  it("appends the note of a supplemented passage in brackets", () => {
    const presentation = getSituationPresentation({
      type: "Nova redação",
      trechos: [
        {
          start: 0,
          end: 10,
          type: "supplement",
          selectedText: "no prazo de 90 dias",
          supplementText: "prazo prorrogado por decreto",
        },
      ],
    });

    expect(presentation.excerpt?.text).toBe(
      "no prazo de 90 dias [prazo prorrogado por decreto]",
    );
  });

  describe("fall back to the legacy free-text fields", () => {
    it("prefers the vetoed text", () => {
      expect(
        getSituationPresentation({
          type: "Veto",
          vetoText: "primeiro",
          vetoOverturnedText: "segundo",
          revokedText: "terceiro",
          newText: "quarto",
        }).excerpt?.text,
      ).toBe("primeiro");
    });

    it("then the text whose veto was overturned", () => {
      expect(
        getSituationPresentation({
          type: "Derrubada de veto",
          vetoOverturnedText: "segundo",
          revokedText: "terceiro",
          newText: "quarto",
        }).excerpt?.text,
      ).toBe("segundo");
    });

    it("then the revoked text", () => {
      expect(
        getSituationPresentation({
          type: "Revogação",
          revokedText: "terceiro",
          newText: "quarto",
        }).excerpt?.text,
      ).toBe("terceiro");
    });

    it("and finally the new text", () => {
      expect(
        getSituationPresentation({
          type: "Nova redação",
          newText: "quarto",
        }).excerpt?.text,
      ).toBe("quarto");
    });

    it("prefers a marked passage over any legacy field", () => {
      expect(
        getSituationPresentation({
          type: "Veto",
          trechos: passage("trecho marcado"),
          vetoText: "texto legado",
        }).excerpt?.text,
      ).toBe("trecho marcado");
    });

    it("trims the stored text", () => {
      expect(
        getSituationPresentation({
          type: "Nova redação",
          newText: "  texto com folga  ",
        }).excerpt?.text,
      ).toBe("texto com folga");
    });
  });

  describe("placeholders that used to be shown as if they were the law", () => {
    it('drops "Texto integral", whatever its casing', () => {
      ["Texto integral", "texto integral", "TEXTO INTEGRAL"].forEach(
        (value) => {
          expect(
            getSituationPresentation({ type: "Revogação", revokedText: value })
              .excerpt,
          ).toBeUndefined();
        },
      );
    });

    it("keeps a real passage that merely mentions the whole text", () => {
      expect(
        getSituationPresentation({
          type: "Revogação",
          revokedText: "Texto integral do parágrafo único",
        }).excerpt?.text,
      ).toBe("Texto integral do parágrafo único");
    });

    it("drops blank and whitespace-only stored text", () => {
      expect(
        getSituationPresentation({ type: "Nova redação", newText: "" }).excerpt,
      ).toBeUndefined();
      expect(
        getSituationPresentation({ type: "Nova redação", newText: "   " })
          .excerpt,
      ).toBeUndefined();
    });
  });
});

describe("extra facts", () => {
  it("reads a renumbering as the reference the device came to have", () => {
    expect(
      getSituationPresentation({
        type: "Renumeração",
        newType: "Parágrafo",
        newIndex: "2º",
      }).details,
    ).toEqual([{ label: "Passou a ser", value: "Parágrafo 2º" }]);
  });

  it("reads a renumbering that only changed the number", () => {
    expect(
      getSituationPresentation({ type: "Renumeração", newIndex: "3º" }).details,
    ).toEqual([{ label: "Passou a ser", value: "3º" }]);
  });

  it("reads a renumbering that only changed the kind of device", () => {
    expect(
      getSituationPresentation({ type: "Renumeração", newType: "Inciso" })
        .details,
    ).toEqual([{ label: "Passou a ser", value: "Inciso" }]);
  });

  it("says nothing when a renumbering records no destination", () => {
    expect(getSituationPresentation({ type: "Renumeração" }).details).toEqual(
      [],
    );
    expect(
      getSituationPresentation({ type: "Renumeração", newIndex: "   " })
        .details,
    ).toEqual([]);
  });

  it("labels a new index on any other type as such", () => {
    expect(
      getSituationPresentation({ type: "Nova redação", newIndex: "4º" })
        .details,
    ).toEqual([{ label: "Novo índice", value: "4º" }]);
  });

  it("trims the new index", () => {
    expect(
      getSituationPresentation({ type: "Nova redação", newIndex: "  4º  " })
        .details,
    ).toEqual([{ label: "Novo índice", value: "4º" }]);
  });

  it("ignores a new kind of device outside a renumbering", () => {
    expect(
      getSituationPresentation({ type: "Nova redação", newType: "Inciso" })
        .details,
    ).toEqual([]);
  });
});

describe("origin of the situation", () => {
  it("is absent when the record says nothing about where it came from", () => {
    ALL_TYPES.forEach((type) => {
      expect(getSituationPresentation({ type }).origin).toBeUndefined();
    });
  });

  it("carries the readable document label and its identifier apart", () => {
    const origin = getSituationPresentation({
      type: "Revogação",
      sourceDocumentId: "lei-16402",
      sourceDocumentLabel: "Lei nº 16.402/2016",
    }).origin;

    expect(origin?.documentLabel).toBe("Lei nº 16.402/2016");
    expect(origin?.documentId).toBe("lei-16402");
  });

  it("carries the device reference and its identifier apart", () => {
    const origin = getSituationPresentation({
      type: "Revogação",
      dispositivo: "art. 3º da Lei nº 16.402/2016",
      relatedDeviceId: "art-3",
    }).origin;

    expect(origin?.deviceLabel).toBe("art. 3º da Lei nº 16.402/2016");
    expect(origin?.deviceId).toBe("art-3");
  });

  it("reads the legacy field names of older records", () => {
    const origin = getSituationPresentation({
      type: "Revogação",
      device: "art. 3º",
      normativeElementId: "art-3",
    }).origin;

    expect(origin?.deviceLabel).toBe("art. 3º");
    expect(origin?.deviceId).toBe("art-3");
  });

  it("prefers the current field names over the legacy ones", () => {
    const origin = getSituationPresentation({
      type: "Revogação",
      dispositivo: "art. 10",
      device: "art. 9º",
      relatedDeviceId: "art-10",
      normativeElementId: "art-9",
    }).origin;

    expect(origin?.deviceLabel).toBe("art. 10");
    expect(origin?.deviceId).toBe("art-10");
  });

  it("treats whitespace-only references as absent", () => {
    expect(
      getSituationPresentation({
        type: "Revogação",
        dispositivo: "   ",
        relatedDeviceId: "  ",
        sourceDocumentId: " ",
        sourceDocumentLabel: "\t",
      }).origin,
    ).toBeUndefined();
  });

  it("exists as soon as a single reference is known, however partial", () => {
    expect(
      getSituationPresentation({ type: "Veto", relatedDeviceId: "x" }).origin
        ?.deviceId,
    ).toBe("x");
    expect(
      getSituationPresentation({ type: "Veto", sourceDocumentId: "y" }).origin
        ?.documentId,
    ).toBe("y");
    expect(
      getSituationPresentation({ type: "Veto", dispositivo: "z" }).origin
        ?.deviceLabel,
    ).toBe("z");
  });

  it("quotes the fragment of the source act, eliding what surrounds it", () => {
    const origin = getSituationPresentation({
      type: "Veto",
      relatedDeviceId: "msg-veto",
      sourceTrechos: [
        {
          start: 14,
          end: 24,
          type: "omission",
          selectedText: "os arts. 3º e 4º",
          anchorBefore: "Ficam vetados ",
          anchorAfter: " do projeto de lei.",
        },
      ],
    }).origin;

    expect(origin?.citation).toBe("[...] os arts. 3º e 4º [...]");
  });

  it("does not quote the source when the whole device is the reference", () => {
    expect(
      getSituationPresentation({
        type: "Veto",
        relatedDeviceId: "msg-veto",
      }).origin?.citation,
    ).toBeUndefined();
  });

  it("keeps the source quotation out of the affected passage, and the reverse", () => {
    // The two lists point at different documents: `trechos` at this element,
    // `sourceTrechos` at the act that caused the situation. Crossing them
    // would attribute one law's words to another.
    const presentation = getSituationPresentation({
      type: "Veto",
      trechos: passage("trecho deste dispositivo"),
      sourceTrechos: [
        {
          start: 0,
          end: 10,
          type: "omission",
          selectedText: "trecho da mensagem de veto",
          anchorAfter: " etc.",
        },
      ],
    });

    expect(presentation.excerpt?.text).toBe("trecho deste dispositivo");
    expect(presentation.origin?.citation).toBe(
      "trecho da mensagem de veto [...]",
    );
  });

  it("is available for every type, since any of them can come from another act", () => {
    ALL_TYPES.forEach((type) => {
      const origin = getSituationPresentation({
        type,
        sourceDocumentLabel: "Lei nº 17.202/2019",
        sourceDocumentId: "lei-17202",
      }).origin;

      expect(origin?.documentLabel).toBe("Lei nº 17.202/2019");
    });
  });
});

describe("a complete record of each kind, as the inspector saves it", () => {
  it("reads a partial veto with its source message", () => {
    const presentation = getSituationPresentation({
      type: "Veto",
      date: "22.03.2016",
      sourceDocumentId: "msg-veto-2016",
      sourceDocumentLabel: "Mensagem de Veto nº 12/2016",
      dispositivo: "razões de veto",
      relatedDeviceId: "msg-12",
      trechos: [
        {
          start: 42,
          end: 78,
          type: "omission",
          selectedText: "ou por profissional habilitado",
          omissionPlaceholder: "(VETADO)",
        },
      ],
    });

    expect(presentation).toMatchObject({
      title: "Veto",
      tone: "negative",
      dateLabel: "em 22.03.2016",
      effect: "Veto parcial: o trecho abaixo foi vetado.",
      excerpt: {
        label: "Trecho vetado",
        text: "ou por profissional habilitado",
        struck: true,
      },
      details: [],
      origin: {
        documentLabel: "Mensagem de Veto nº 12/2016",
        documentId: "msg-veto-2016",
        deviceLabel: "razões de veto",
        deviceId: "msg-12",
      },
    });
  });

  it("reads a new wording introduced by an amending act", () => {
    const presentation = getSituationPresentation({
      type: "Nova redação",
      date: "10.07.2019",
      sourceDocumentId: "lei-17202",
      sourceDocumentLabel: "Lei nº 17.202/2019",
      relatedDeviceId: "art-4",
      dispositivo: "art. 4º",
      newText: "O prazo de análise será de 60 (sessenta) dias.",
    });

    expect(presentation).toMatchObject({
      tone: "informative",
      dateLabel: "em 10.07.2019",
      effect: "O dispositivo recebeu nova redação.",
      excerpt: {
        label: "Nova redação",
        text: "O prazo de análise será de 60 (sessenta) dias.",
        struck: false,
      },
    });
  });

  it("reads a renumbering caused by an amending act", () => {
    const presentation = getSituationPresentation({
      type: "Renumeração",
      date: "10.07.2019",
      newType: "Parágrafo",
      newIndex: "3º",
      sourceDocumentLabel: "Lei nº 17.202/2019",
      revokedText: "Texto integral",
    });

    expect(presentation.effect).toBe("O dispositivo foi renumerado.");
    expect(presentation.details).toEqual([
      { label: "Passou a ser", value: "Parágrafo 3º" },
    ]);
    // A renumbering does not quote anything: the words did not change.
    expect(presentation.excerpt).toBeUndefined();
  });

  it("reads a conditional change of initial validity", () => {
    const presentation = getSituationPresentation({
      type: "Vigência inicial alterada",
      date: "vigência condicionada",
      sourceDocumentLabel: "Decreto nº 57.776/2017",
    });

    expect(presentation.tone).toBe("neutral");
    expect(presentation.dateLabel).toBe("vigência condicionada");
    expect(presentation.effect).toBe(
      "A vigência inicial deste dispositivo foi alterada.",
    );
    expect(presentation.excerpt).toBeUndefined();
  });

  it("reads an unconstitutionality declared without cutting the text", () => {
    const presentation = getSituationPresentation({
      type: "Declaração de inconstitucionalidade sem redução de texto",
      date: "05.05.2021",
      sourceDocumentLabel: "ADI 1234",
      trechos: passage("aplicando-se também aos imóveis rurais"),
    });

    expect(presentation.tone).toBe("negative");
    // No partial copy: the whole device is affected even though a passage is
    // quoted to show which reading was ruled out.
    expect(presentation.effect).toBe(
      "Foi declarada a inconstitucionalidade, sem redução de texto.",
    );
    expect(presentation.excerpt).toEqual({
      label: "Texto atingido",
      text: "aplicando-se também aos imóveis rurais",
      struck: false,
    });
  });
});
