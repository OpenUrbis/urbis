import type { SpecialSituation } from "../../domain/entities";
import {
  CONDITIONAL_VALIDITY,
  isConditionalValidity,
} from "../../domain/validity";
import {
  buildAnnotatedSegmentsExcerpt,
  buildCitationFromAnchoredSegments,
  normalizeAnnotatedTextSegments,
} from "../../domain/text-utils";
import {
  getSituationDeviceLabel,
  getSituationRelatedDeviceId,
  getSituationSourceDocumentId,
  getSituationSourceDocumentLabel,
} from "./SituationLogic";

/**
 * Turns a `SpecialSituation` record into something a reader can understand.
 *
 * The cards used to render the data model field by field, which produced
 * duplicated headings ("Perda definitiva de vigor/eficácia" twice), raw
 * identifiers as primary content ("lei_lpuos"), and placeholder strings shown as
 * if they were content ("Texto integral", "Não informado"). This module decides
 * what a situation *means* so the card only has to lay it out.
 */

export type SituationTone = "negative" | "positive" | "informative" | "neutral";

export interface SituationOrigin {
  /** Human-readable document label, when known. */
  documentLabel?: string;
  /** Raw document identifier — shown only as a discreet fallback. */
  documentId?: string;
  /** Device reference such as "art. 3º da Lei X". */
  deviceLabel?: string;
  /** Raw element identifier, used for the in-page anchor. */
  deviceId?: string;
  /**
   * Quoted fragment of the source act, with "[...]" standing for the elided
   * surroundings. Absent when the whole source device is the reference.
   */
  citation?: string;
}

export interface SituationExcerpt {
  label: string;
  text: string;
  /** Whether the quoted passage should be rendered struck through. */
  struck: boolean;
}

export type SituationPresentationSurface = "admin" | "reader";

export interface SituationPresentationOptions {
  surface?: SituationPresentationSurface;
  /** Effective validity of the affected element, never the source act date. */
  effectiveStartDate?: string;
  effectiveEndDate?: string;
}

export interface SituationPresentation {
  /** Official type name. Rendered exactly once. */
  title: string;
  tone: SituationTone;
  /** Date already carrying its preposition, e.g. "em 22.03.2016". */
  dateLabel?: string;
  /** Plain-language description of what happened to the device. */
  effect: string;
  /** Quoted passage, present only for partial situations. */
  excerpt?: SituationExcerpt;
  /** Extra facts, e.g. the new numbering after a renumbering. */
  details: { label: string; value: string }[];
  /** Label of the reference line in the reading view. */
  originLabel?: string;
  origin?: SituationOrigin;
}

const NEGATIVE_TYPES = new Set<SpecialSituation["type"]>([
  "Veto",
  "Revogação",
  "Anulação",
  "Cassação",
  "Perda definitiva de vigor/eficácia",
  "Suspensão de vigor/eficácia",
  "Declaração de inconstitucionalidade sem redução de texto",
]);

const POSITIVE_TYPES = new Set<SpecialSituation["type"]>([
  "Derrubada de veto",
  "Repristinação",
  "Restauração de vigor/eficácia",
]);

const INFORMATIVE_TYPES = new Set<SpecialSituation["type"]>([
  "Nova redação",
  "Acréscimo",
  "Alteração de ementa",
  "Interpretação conforme à Constituição",
]);

function getTone(type: SpecialSituation["type"]): SituationTone {
  if (NEGATIVE_TYPES.has(type)) return "negative";
  if (POSITIVE_TYPES.has(type)) return "positive";
  if (INFORMATIVE_TYPES.has(type)) return "informative";
  return "neutral";
}

const DEVICE_REFERENCE_TYPES = new Set<SpecialSituation["type"]>([
  "Veto",
  "Derrubada de veto",
  "Revogação",
  "Anulação",
  "Cassação",
]);

const READER_TITLES: Partial<Record<SpecialSituation["type"], string>> = {
  Veto: "VETO",
  "Derrubada de veto": "DERRUBADA DE VETO",
  Renumeração: "RENUMERAÇÃO",
  "Nova redação": "NOVA REDAÇÃO",
  "Perda definitiva de vigor/eficácia":
    "PERDA DEFINITIVA DE VIGOR/EFICÁCIA",
  "Suspensão de vigor/eficácia": "SUSPENSÃO DE VIGOR/EFICÁCIA",
  "Restauração de vigor/eficácia": "RESTAURAÇÃO DE VIGOR/EFICÁCIA",
  "Interpretação conforme à Constituição":
    "INTERPRETAÇÃO CONFORME À CONSTITUIÇÃO",
  "Declaração de inconstitucionalidade sem redução de texto":
    "DECLARAÇÃO DE INCONSTITUCIONALIDADE SEM REDUÇÃO DE TEXTO",
  Acréscimo: "ACRÉSCIMO",
  Revogação: "REVOGAÇÃO",
  Anulação: "ANULAÇÃO",
  Cassação: "CASSAÇÃO",
  Repristinação: "REPRISTINAÇÃO",
  "Vigência inicial alterada": "VIGÊNCIA NÃO INICIADA",
  "Vigência final alterada": "VIGÊNCIA FINALIZADA",
  "Alteração de ementa": "ALTERAÇÃO DE EMENTA",
};

function formatReaderDate(date?: string): string | undefined {
  const normalized = date?.trim();
  if (!normalized) return undefined;
  return isConditionalValidity(normalized) ? CONDITIONAL_VALIDITY : normalized;
}

function getDateLabel(
  situation: SpecialSituation,
  fallbackDate?: string,
  options: SituationPresentationOptions = {},
): string | undefined {
  const isReader = options.surface === "reader";

  // A veto card describes the vetoed text/device, not the date of the act that
  // imposed it. The date remains available in the Admin record.
  if (isReader && situation.type === "Veto") return undefined;

  let date = situation.date?.trim() || fallbackDate?.trim();
  if (isReader && situation.type === "Revogação") {
    date = options.effectiveStartDate?.trim();
    return date ? `Início da vigência: ${formatReaderDate(date)}` : undefined;
  }
  if (isReader && situation.type === "Anulação") {
    date = options.effectiveStartDate?.trim();
    return date ? `Início da vigência: ${formatReaderDate(date)}` : undefined;
  }
  if (isReader && situation.type === "Cassação") {
    date = options.effectiveStartDate?.trim();
    return date ? `Início da vigência: ${formatReaderDate(date)}` : undefined;
  }
  if (isReader && situation.type === "Vigência inicial alterada") {
    date = options.effectiveStartDate?.trim() || date;
    return date ? `Início da vigência: ${formatReaderDate(date)}` : undefined;
  }
  if (isReader && situation.type === "Vigência final alterada") {
    date = options.effectiveEndDate?.trim() || date;
    return date ? `Fim da vigência: ${formatReaderDate(date)}` : undefined;
  }

  const formatted = formatReaderDate(date);
  if (!formatted) return undefined;
  if (isConditionalValidity(formatted)) return CONDITIONAL_VALIDITY;

  if (situation.type === "Vigência inicial alterada")
    return `a partir de ${formatted}`;
  if (situation.type === "Vigência final alterada") return `até ${formatted}`;

  return `em ${formatted}`;
}

/**
 * Copy for each type, split by whether the situation hits the whole device or
 * only part of it. `partialEffect` is omitted when the quoted passage already
 * says everything the reader needs.
 */
const EFFECT_COPY: Record<
  string,
  { whole: string; partial?: string; excerptLabel?: string; struck?: boolean }
> = {
  Veto: {
    whole: "Todo o dispositivo foi vetado.",
    partial: "Veto parcial: o trecho abaixo foi vetado.",
    excerptLabel: "Trecho vetado",
    struck: true,
  },
  "Derrubada de veto": {
    whole: "O veto foi derrubado e o dispositivo voltou a vigorar.",
    partial:
      "O veto foi derrubado quanto ao trecho abaixo, que voltou a vigorar.",
    excerptLabel: "Trecho com veto derrubado",
  },
  "Perda definitiva de vigor/eficácia": {
    whole: "Todo o dispositivo perdeu vigor/eficácia em definitivo.",
    partial: "O trecho abaixo perdeu vigor/eficácia em definitivo.",
    excerptLabel: "Trecho sem vigor/eficácia",
    struck: true,
  },
  "Suspensão de vigor/eficácia": {
    whole: "Todo o dispositivo está com vigor/eficácia suspenso.",
    partial: "O trecho abaixo está com vigor/eficácia suspenso.",
    excerptLabel: "Trecho suspenso",
    struck: true,
  },
  Revogação: {
    whole: "Todo o dispositivo foi revogado.",
    partial: "O trecho abaixo foi revogado.",
    excerptLabel: "Trecho revogado",
    struck: true,
  },
  Anulação: {
    whole: "Todo o dispositivo foi anulado.",
    partial: "O trecho abaixo foi anulado.",
    excerptLabel: "Trecho anulado",
    struck: true,
  },
  Cassação: {
    whole: "Todo o dispositivo foi cassado.",
    partial: "O trecho abaixo foi cassado.",
    excerptLabel: "Trecho cassado",
    struck: true,
  },
  "Restauração de vigor/eficácia": {
    whole: "O vigor/eficácia do dispositivo foi restaurado.",
    partial: "O vigor/eficácia do trecho abaixo foi restaurado.",
    excerptLabel: "Trecho restaurado",
  },
  Repristinação: {
    whole: "O dispositivo foi repristinado e voltou a vigorar.",
    partial: "O trecho abaixo foi repristinado e voltou a vigorar.",
    excerptLabel: "Texto restaurado",
  },
  "Nova redação": {
    whole: "O dispositivo recebeu nova redação.",
    excerptLabel: "Nova redação",
  },
  "Alteração de ementa": {
    whole: "A ementa foi alterada.",
    excerptLabel: "Ementa alterada",
  },
  Acréscimo: {
    whole: "Foi acrescido texto ao dispositivo.",
    excerptLabel: "Texto acrescido",
  },
  "Interpretação conforme à Constituição": {
    whole: "Foi fixada interpretação conforme à Constituição.",
    excerptLabel: "Texto com interpretação fixada",
  },
  "Declaração de inconstitucionalidade sem redução de texto": {
    whole: "Foi declarada a inconstitucionalidade, sem redução de texto.",
    excerptLabel: "Texto atingido",
  },
  Renumeração: {
    whole: "O dispositivo foi renumerado.",
  },
  "Vigência inicial alterada": {
    whole: "A vigência inicial deste dispositivo foi alterada.",
  },
  "Vigência final alterada": {
    whole: "A vigência final deste dispositivo foi alterada.",
  },
};

/**
 * The quoted passage, if any. Prefers the persisted segments (which carry the
 * exact selected text) and falls back to the legacy free-text fields.
 */
function getExcerptText(situation: SpecialSituation): string | undefined {
  const segments = normalizeAnnotatedTextSegments(situation.trechos);
  if (segments.length) {
    const excerpt = buildAnnotatedSegmentsExcerpt(segments).trim();
    if (excerpt) return excerpt;
  }

  const legacy =
    situation.vetoText ??
    situation.vetoOverturnedText ??
    situation.revokedText ??
    situation.newText;

  const trimmed = legacy?.trim();
  if (!trimmed) return undefined;

  // Legacy placeholder that used to be displayed verbatim to the reader.
  if (/^texto integral$/i.test(trimmed)) return undefined;

  return trimmed;
}

function getOrigin(situation: SpecialSituation): SituationOrigin | undefined {
  const documentLabel = getSituationSourceDocumentLabel(situation);
  const documentId = getSituationSourceDocumentId(situation);
  const deviceLabel = getSituationDeviceLabel(situation);
  const deviceId = getSituationRelatedDeviceId(situation);
  const citation = buildCitationFromAnchoredSegments(situation.sourceTrechos);

  if (!documentLabel && !documentId && !deviceLabel && !deviceId && !citation) {
    return undefined;
  }

  return { documentLabel, documentId, deviceLabel, deviceId, citation };
}

export function getSituationPresentation(
  situation: SpecialSituation,
  fallbackDate?: string,
  options: SituationPresentationOptions = {},
): SituationPresentation {
  const isReader = options.surface === "reader";
  const copy = EFFECT_COPY[situation.type] ?? {
    whole: "Situação especial registrada.",
  };
  const excerptText = getExcerptText(situation);
  const hasSegments =
    normalizeAnnotatedTextSegments(situation.trechos).length > 0;
  const isPartial = hasSegments && !!copy.partial;

  const details: { label: string; value: string }[] = [];

  if (situation.type === "Renumeração") {
    const newReference = [situation.newType, situation.newIndex]
      .filter((part) => !!part?.toString().trim())
      .join(" ")
      .trim();

    if (newReference) {
      details.push({ label: "Passou a ser", value: newReference });
    }
  } else if (situation.newIndex?.trim()) {
    details.push({ label: "Novo índice", value: situation.newIndex.trim() });
  }

  const origin = getOrigin(situation);
  const publicEffect =
    isReader && situation.type === "Veto" && !isPartial
      ? ""
      : isReader && situation.type === "Revogação" && !isPartial
        ? ""
        : isPartial
          ? copy.partial!
          : copy.whole;
  const excerptLabel =
    isReader && situation.type === "Veto"
      ? "Texto(s) vetado(s)"
      : isReader && situation.type === "Revogação" && !hasSegments
        ? "Dispositivo revogado"
        : copy.excerptLabel;

  return {
    title: isReader
      ? READER_TITLES[situation.type] || situation.type
      : situation.type,
    tone: getTone(situation.type),
    dateLabel: getDateLabel(situation, fallbackDate, options),
    effect: publicEffect,
    excerpt:
      excerptText && excerptLabel
        ? {
            label: excerptLabel,
            text: excerptText,
            struck: !!copy.struck,
          }
        : undefined,
    details,
    originLabel:
      origin &&
      DEVICE_REFERENCE_TYPES.has(situation.type) &&
      (origin.deviceLabel || origin.deviceId)
        ? "Dispositivo"
        : "Origem",
    origin,
  };
}
