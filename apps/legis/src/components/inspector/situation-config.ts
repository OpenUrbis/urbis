import type {
  SpecialSituation,
  SpecialSituationType,
} from "../../domain/types";
import {
  buildAnnotatedSegmentsExcerpt,
  normalizeAnnotatedTextSegments,
} from "../../domain/text-utils";
import type { SituationGroupType } from "../page/SituationLogic";
import {
  FORM_GROUP_TITLES,
  SITUATION_TYPE_MAP,
  withSpecialSituationCompatibilityFields,
} from "../page/SituationLogic";

/**
 * Declarative description of every special situation type.
 *
 * The panel used to branch with near-identical `if` blocks per type (veto,
 * derrubada de veto and the five revocation-like types each had their own copy of
 * the same markup). Everything the form needs to know now lives here.
 */

/** Field that stores the human-readable excerpt derived from the passages. */
export type ExcerptField = "vetoText" | "vetoOverturnedText" | "revokedText";

export interface SituationTypeConfig {
  /** Whether passages can be marked for this type. */
  supportsTrechos: boolean;
  excerptField?: ExcerptField;
  /** Label of the passage section, e.g. "Trecho vetado". */
  trechoLabel?: string;
  /** Replacement rendered in place of an omitted passage. */
  omissionPlaceholder?: string;
  /** Whether the type carries a replacement/added text. */
  supportsNewText: boolean;
  newTextLabel?: string;
  /** Renumbering carries a new index and optionally a new type. */
  supportsRenumbering: boolean;
  /** Label of the date field. */
  dateLabel: string;
  helpText?: string;
  /** Sentence describing what happens when the whole device is affected. */
  wholeDeviceHint?: string;
}

const REVOCATION_LIKE: SpecialSituationType[] = [
  "Perda definitiva de vigor/eficácia",
  "Suspensão de vigor/eficácia",
  "Revogação",
  "Anulação",
  "Cassação",
];

const DEFAULT_DATE_LABEL = "Data da situação especial";

function excerptConfig(
  excerptField: ExcerptField,
  trechoLabel: string,
  omissionPlaceholder: string,
  wholeDeviceHint: string,
): SituationTypeConfig {
  return {
    supportsTrechos: true,
    excerptField,
    trechoLabel,
    omissionPlaceholder,
    supportsNewText: false,
    supportsRenumbering: false,
    dateLabel: DEFAULT_DATE_LABEL,
    wholeDeviceHint,
  };
}

function newTextConfig(newTextLabel: string): SituationTypeConfig {
  return {
    supportsTrechos: false,
    supportsNewText: true,
    newTextLabel,
    supportsRenumbering: false,
    dateLabel: DEFAULT_DATE_LABEL,
  };
}

export const SITUATION_TYPE_CONFIG: Record<
  SpecialSituationType,
  SituationTypeConfig
> = {
  Veto: excerptConfig(
    "vetoText",
    "Trecho vetado",
    "(VETADO)",
    "",
  ),
  "Derrubada de veto": excerptConfig(
    "vetoOverturnedText",
    "Trecho com veto derrubado",
    "(VETO DERRUBADO)",
    "",
  ),
  "Perda definitiva de vigor/eficácia": excerptConfig(
    "revokedText",
    "Trecho sem vigor/eficácia",
    "[...]",
    "",
  ),
  "Suspensão de vigor/eficácia": excerptConfig(
    "revokedText",
    "Trecho suspenso",
    "[...]",
    "",
  ),
  Revogação: excerptConfig(
    "revokedText",
    "Trecho revogado",
    "[...]",
    "",
  ),
  Anulação: excerptConfig(
    "revokedText",
    "Trecho anulado",
    "[...]",
    "",
  ),
  Cassação: excerptConfig(
    "revokedText",
    "Trecho cassado",
    "[...]",
    "",
  ),

  "Nova redação": newTextConfig("Nova redação"),
  "Alteração de ementa": newTextConfig("Ementa alterada"),
  Acréscimo: newTextConfig(
    "Trecho do Elemento normativo que acrescenta",
  ),
  "Interpretação conforme à Constituição": newTextConfig(
    "Texto com interpretação fixada",
  ),
  "Declaração de inconstitucionalidade sem redução de texto": newTextConfig(
    "Texto com declaração de inconstitucionalidade",
  ),
  Repristinação: newTextConfig("Texto restaurado"),

  "Restauração de vigor/eficácia": {
    supportsTrechos: false,
    supportsNewText: false,
    supportsRenumbering: false,
    dateLabel: DEFAULT_DATE_LABEL,
  },

  Renumeração: {
    supportsTrechos: false,
    supportsNewText: false,
    supportsRenumbering: true,
    dateLabel: DEFAULT_DATE_LABEL,
  },

  "Vigência inicial alterada": {
    supportsTrechos: false,
    supportsNewText: false,
    supportsRenumbering: false,
    dateLabel: "Data da vigência inicial alterada",
    helpText:
      "Use para definir a vigência inicial específica deste elemento, caso difira da vigência original da norma.",
  },
  "Vigência final alterada": {
    supportsTrechos: false,
    supportsNewText: false,
    supportsRenumbering: false,
    dateLabel: "Data da vigência final alterada",
    helpText:
      "Use para definir a vigência final específica deste elemento, caso difira da vigência final original da norma.",
  },
};

export function getSituationTypeConfig(
  type?: SpecialSituationType,
): SituationTypeConfig {
  return (type && SITUATION_TYPE_CONFIG[type]) || SITUATION_TYPE_CONFIG["Veto"];
}

export function isRevocationLikeSituation(
  type?: SpecialSituationType,
): boolean {
  return !!type && REVOCATION_LIKE.includes(type);
}

/** Options grouped by their situation group, so the picker is scannable. */
export interface SituationTypeOptionGroup {
  group: SituationGroupType;
  label: string;
  types: SpecialSituationType[];
}

const GROUP_ORDER: SituationGroupType[] = [
  "VETO_GROUP",
  "ALTERATION_GROUP",
  "VIGOR_GROUP",
  "INTERPRETATION_GROUP",
  "EXISTENCE_GROUP",
  "VALIDITY_GROUP",
  "OTHER",
];

/** Stable order used by the Admin, matching the agreed registration workflow. */
const FORM_TYPE_ORDER: SpecialSituationType[] = [
  "Veto",
  "Derrubada de veto",
  "Renumeração",
  "Nova redação",
  // Kept for legacy records; it belongs to the redaction family.
  "Alteração de ementa",
  "Perda definitiva de vigor/eficácia",
  "Suspensão de vigor/eficácia",
  "Restauração de vigor/eficácia",
  "Interpretação conforme à Constituição",
  "Declaração de inconstitucionalidade sem redução de texto",
  "Acréscimo",
  "Revogação",
  "Anulação",
  "Cassação",
  "Repristinação",
  "Vigência inicial alterada",
  "Vigência final alterada",
];

export const SITUATION_TYPE_OPTION_GROUPS: SituationTypeOptionGroup[] = (() => {
  const byGroup = new Map<SituationGroupType, SpecialSituationType[]>();

  (Object.keys(SITUATION_TYPE_CONFIG) as SpecialSituationType[]).forEach(
    (type) => {
      const group = (SITUATION_TYPE_MAP[type] ?? "OTHER") as SituationGroupType;
      const existing = byGroup.get(group) ?? [];
      existing.push(type);
      byGroup.set(group, existing);
    },
  );

  const order = new Map(FORM_TYPE_ORDER.map((type, index) => [type, index]));

  return GROUP_ORDER.filter((group) => byGroup.has(group)).map((group) => ({
    group,
    label: FORM_GROUP_TITLES[group],
    types: byGroup.get(group)!.sort(
      (a, b) =>
        (order.get(a) ?? Number.MAX_SAFE_INTEGER) -
          (order.get(b) ?? Number.MAX_SAFE_INTEGER) ||
        a.localeCompare(b, "pt-BR"),
    ),
  }));
})();

/**
 * Fields that no longer apply after the type changes are dropped, so a draft
 * cannot carry, say, a veto excerpt into a renumbering.
 */
export function pruneSituationDraftForType(
  draft: Partial<SpecialSituation>,
  type: SpecialSituationType,
): Partial<SpecialSituation> {
  const config = getSituationTypeConfig(type);

  return {
    type,
    date: draft.date,
    sourceDocumentId: draft.sourceDocumentId,
    sourceDocumentLabel: draft.sourceDocumentLabel,
    relatedDeviceId: draft.relatedDeviceId,
    normativeElementId: draft.normativeElementId,
    dispositivo: draft.dispositivo,
    device: draft.device,
    trechos: config.supportsTrechos ? draft.trechos : undefined,
    // Passages of the source act survive any type change: they describe the
    // act that caused the situation, not the affected element.
    sourceTrechos: draft.sourceTrechos,
    vetoText: config.excerptField === "vetoText" ? draft.vetoText : undefined,
    vetoOverturnedText:
      config.excerptField === "vetoOverturnedText"
        ? draft.vetoOverturnedText
        : undefined,
    revokedText:
      config.excerptField === "revokedText" ? draft.revokedText : undefined,
    newText: config.supportsNewText ? draft.newText : undefined,
    newIndex: config.supportsRenumbering ? draft.newIndex : undefined,
    newType: config.supportsRenumbering ? draft.newType : undefined,
  };
}

/**
 * Keeps the readable excerpt field in sync with the marked passages, so the
 * stored situation never claims a different passage than the one highlighted.
 */
export function withDerivedExcerpt(
  draft: Partial<SpecialSituation>,
): Partial<SpecialSituation> {
  const config = getSituationTypeConfig(
    draft.type as SpecialSituationType | undefined,
  );
  if (!config.supportsTrechos || !config.excerptField) return draft;

  const segments = normalizeAnnotatedTextSegments(draft.trechos);
  const excerpt = segments.length
    ? buildAnnotatedSegmentsExcerpt(segments)
    : undefined;

  return { ...draft, [config.excerptField]: excerpt };
}

/**
 * Whether a situation draft has all required fields to be saved.
 * Toda situação especial deve exigir vínculo a Elemento normativo.
 */
export function isSituationDraftValid(
  draft: Partial<SpecialSituation>,
): boolean {
  if (!draft.type) return false;

  const hasLinkedElement = Boolean(
    draft.relatedDeviceId?.trim() ||
      draft.normativeElementId?.trim() ||
      draft.sourceDocumentId?.trim(),
  );

  if (!hasLinkedElement) return false;

  // An addition is derived from the linked source device. It must not be saved
  // as a free-text element with only a manually typed origin.
  if (draft.type === "Acréscimo") {
    return Boolean(
      draft.newText?.trim() || normalizeAnnotatedTextSegments(draft.sourceTrechos).length,
    );
  }

  return true;
}

/** Turns a draft into the record persisted on the element. */
export function buildSituationFromDraft(
  draft: Partial<SpecialSituation>,
): SpecialSituation {
  return withSpecialSituationCompatibilityFields(
    withDerivedExcerpt(draft) as SpecialSituation,
  );
}

/**
 * Whether passages of the source act can be marked. Requires a linked device:
 * without it there is no source text to mark.
 */
export function canMarkSourceTrechos(
  draft: Partial<SpecialSituation>,
): boolean {
  return !!draft.relatedDeviceId?.trim();
}

/**
 * Inserts or replaces a situation in a list. `editingIndex === null` appends,
 * which is what makes editing an existing situation possible at all — the old
 * panel could only remove and re-create.
 */
export function upsertSituation(
  situations: SpecialSituation[] | undefined,
  situation: SpecialSituation,
  editingIndex: number | null,
): SpecialSituation[] {
  const next = [...(situations || [])];

  if (
    editingIndex === null ||
    editingIndex < 0 ||
    editingIndex >= next.length
  ) {
    next.push(situation);
    return next;
  }

  next[editingIndex] = situation;
  return next;
}
