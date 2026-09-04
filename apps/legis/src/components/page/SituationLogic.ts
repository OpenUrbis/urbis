import {
  NormativeElementEntity,
  NewTextSpecialSituationType,
  SpecialSituation,
} from "../../domain/entities";
import { parse, isValid, compareDesc, compareAsc, isAfter } from "date-fns";
import {
  Ban,
  Edit,
  AlertTriangle,
  RefreshCw,
  FileText,
  Clock,
  Info,
} from "lucide-react";
import React from "react";
import { formatValidityDate } from "../../domain/validity";

export type SituationGroupType =
  | "VETO_GROUP"
  | "ALTERATION_GROUP"
  | "VIGOR_GROUP"
  | "EXISTENCE_GROUP"
  | "INTERPRETATION_GROUP"
  | "VALIDITY_GROUP"
  | "OTHER";

export interface SituationGroup {
  id: string;
  elementId: string;
  elementKey: string;
  type: SituationGroupType;
  situations: SpecialSituation[];
  latestDate: Date;
}

export const SITUATION_TYPE_MAP: Record<string, SituationGroupType> = {
  Veto: "VETO_GROUP",
  "Derrubada de veto": "VETO_GROUP",

  Renumeração: "ALTERATION_GROUP",
  "Nova redação": "ALTERATION_GROUP",
  "Alteração de ementa": "ALTERATION_GROUP",

  "Suspensão de vigor/eficácia": "VIGOR_GROUP",
  "Restauração de vigor/eficácia": "VIGOR_GROUP",
  "Perda definitiva de vigor/eficácia": "VIGOR_GROUP",

  Acréscimo: "EXISTENCE_GROUP",
  Revogação: "EXISTENCE_GROUP",
  Anulação: "EXISTENCE_GROUP",
  Cassação: "EXISTENCE_GROUP",
  Repristinação: "EXISTENCE_GROUP",
  Extinção: "EXISTENCE_GROUP",

  "Interpretação conforme à Constituição": "INTERPRETATION_GROUP",
  "Declaração de inconstitucionalidade sem redução de texto":
    "INTERPRETATION_GROUP",

  "Vigência inicial alterada": "VALIDITY_GROUP",
  "Vigência final alterada": "VALIDITY_GROUP",
};

export const GROUP_TITLES: Record<SituationGroupType, string> = {
  VETO_GROUP: "Veto",
  ALTERATION_GROUP: "Alteração e Redação",
  VIGOR_GROUP: "Vigor e eficácia",
  EXISTENCE_GROUP: "Modificação da Estrutura",
  INTERPRETATION_GROUP: "Interpretação e Constitucionalidade",
  VALIDITY_GROUP: "Vigência e Prazos",
  OTHER: "Outras situações",
};

export const NEW_TEXT_SITUATION_TYPES: NewTextSpecialSituationType[] = [
  "Nova redação",
  "Alteração de ementa",
  "Acréscimo",
  "Interpretação conforme à Constituição",
  "Declaração de inconstitucionalidade sem redução de texto",
  "Repristinação",
];

const NEW_TEXT_SITUATION_TYPE_SET = new Set<string>(NEW_TEXT_SITUATION_TYPES);

export function isNewTextSituationType(
  type?: string,
): type is NewTextSpecialSituationType {
  return !!type && NEW_TEXT_SITUATION_TYPE_SET.has(type);
}

export function isNewTextSituation(situation?: SpecialSituation): boolean {
  return !!situation && isNewTextSituationType(situation.type);
}

export function getSituationDeviceLabel(
  situation?: SpecialSituation,
): string | undefined {
  const value = situation?.dispositivo?.trim() || situation?.device?.trim();
  return value || undefined;
}

export function getSituationRelatedDeviceId(
  situation?: SpecialSituation,
): string | undefined {
  const value =
    situation?.relatedDeviceId?.trim() || situation?.normativeElementId?.trim();
  return value || undefined;
}

export function getSituationSourceDocumentId(
  situation?: SpecialSituation,
): string | undefined {
  const value = situation?.sourceDocumentId?.trim();
  return value || undefined;
}

export function getSituationSourceDocumentLabel(
  situation?: SpecialSituation,
): string | undefined {
  const value = situation?.sourceDocumentLabel?.trim();
  return value || undefined;
}

export function withSpecialSituationCompatibilityFields(
  situation: SpecialSituation,
): SpecialSituation {
  const deviceLabel = getSituationDeviceLabel(situation);
  const relatedDeviceId = getSituationRelatedDeviceId(situation);
  const sourceDocumentId = getSituationSourceDocumentId(situation);
  const sourceDocumentLabel = getSituationSourceDocumentLabel(situation);

  return {
    ...situation,
    dispositivo: deviceLabel,
    device: deviceLabel,
    relatedDeviceId,
    normativeElementId: relatedDeviceId,
    sourceDocumentId,
    sourceDocumentLabel,
  };
}

export function getSituationNewTextLabel(
  type: NewTextSpecialSituationType,
): string;
export function getSituationNewTextLabel(type?: string): string;
export function getSituationNewTextLabel(type?: string): string {
  switch (type) {
    case "Alteração de ementa":
      return "Ementa alterada";
    case "Acréscimo":
      return "Texto acrescido";
    case "Interpretação conforme à Constituição":
      return "Texto com interpretação fixada";
    case "Declaração de inconstitucionalidade sem redução de texto":
      return "Texto com declaração de inconstitucionalidade";
    case "Repristinação":
      return "Texto restaurado";
    case "Nova redação":
    default:
      return "Nova redação";
  }
}

export const parseDate = (dateStr?: string) => {
  if (!dateStr || dateStr === "vigência condicionada") return new Date(0);
  try {
    const d = parse(dateStr, "dd.MM.yyyy", new Date());
    return isValid(d) ? d : new Date(0);
  } catch {
    return new Date(0);
  }
};

function getLatestSituationByType(
  situations: SpecialSituation[] | undefined,
  type: SpecialSituation["type"],
): SpecialSituation | undefined {
  return (situations || [])
    .filter((situation) => situation.type === type)
    .sort((a, b) => compareDesc(parseDate(a.date), parseDate(b.date)))[0];
}

export function getEffectiveValidityDates(
  element: NormativeElementEntity,
  originalEndValidity?: { date?: string },
) {
  const latestStartAlteration = getLatestSituationByType(
    element.specialSituations,
    "Vigência inicial alterada",
  );
  const latestEndAlteration = getLatestSituationByType(
    element.specialSituations,
    "Vigência final alterada",
  );

  return {
    startDate:
      latestStartAlteration?.date || element.originalStartValidity?.date,
    endDate:
      latestEndAlteration?.date ||
      originalEndValidity?.date ||
      element.originalEndValidity?.date,
    latestStartAlteration,
    latestEndAlteration,
  };
}

function formatEffectiveValidityDate(dateStr?: string) {
  if (!dateStr) return "sem data";
  if (dateStr === "vigência condicionada") return "vigência condicionada";

  return formatValidityDate(dateStr);
}

export function getElementValiditySummary(
  element: NormativeElementEntity,
  originalEndValidity?: { date?: string },
): string | null {
  const { startDate, endDate } = getEffectiveValidityDates(
    element,
    originalEndValidity,
  );

  if (!startDate && !endDate) return null;

  let baseSummary = "Vigência não definida";

  if (startDate && endDate) {
    baseSummary = `Vigência: de ${formatEffectiveValidityDate(startDate)} até ${formatEffectiveValidityDate(endDate)}`;
  } else if (startDate) {
    baseSummary =
      startDate === "vigência condicionada"
        ? "Vigência condicionada"
        : `Vigência: a partir de ${formatEffectiveValidityDate(startDate)}`;
  } else if (endDate) {
    baseSummary =
      endDate === "vigência condicionada"
        ? "Vigência condicionada"
        : `Vigência: até ${formatEffectiveValidityDate(endDate)}`;
  }

  if (isValidityNotStarted(element)) {
    return `${baseSummary} · suspensa por vigência inicial`;
  }

  if (isValidityEnded(element, originalEndValidity)) {
    return `${baseSummary} · suspensa por vigência final`;
  }

  return baseSummary;
}

export function getIconForType(type: SituationGroupType) {
  switch (type) {
    case "VETO_GROUP":
      return React.createElement(Ban, { className: "h-3.5 w-3.5" });
    case "ALTERATION_GROUP":
      return React.createElement(Edit, { className: "h-3.5 w-3.5" });
    case "VIGOR_GROUP":
      return React.createElement(AlertTriangle, { className: "h-3.5 w-3.5" });
    case "EXISTENCE_GROUP":
      return React.createElement(RefreshCw, { className: "h-3.5 w-3.5" });
    case "INTERPRETATION_GROUP":
      return React.createElement(FileText, { className: "h-3.5 w-3.5" });
    case "VALIDITY_GROUP":
      return React.createElement(Clock, { className: "h-3.5 w-3.5" });
    default:
      return React.createElement(Info, { className: "h-3.5 w-3.5" });
  }
}

/**
 * Determines if an element's validity hasn't started yet.
 * Based on the latest "Vigência inicial alterada" or the original start validity.
 */
export function isValidityNotStarted(element: NormativeElementEntity): boolean {
  const alterations = (element.specialSituations || [])
    .filter((s) => s.type === "Vigência inicial alterada")
    .sort((a, b) => compareDesc(parseDate(a.date), parseDate(b.date)));

  const effectiveDateStr =
    alterations.length > 0
      ? alterations[0].date
      : element.originalStartValidity?.date;

  if (effectiveDateStr === "vigência condicionada") return true;

  const effectiveDate = parseDate(effectiveDateStr);
  return isAfter(effectiveDate, new Date());
}

/**
 * Determines if an element's validity has ended.
 * Based on the latest "Vigência final alterada" or the original end validity.
 */
export function isValidityEnded(
  element: NormativeElementEntity,
  originalEndValidity?: any,
): boolean {
  const alterations = (element.specialSituations || [])
    .filter((s) => s.type === "Vigência final alterada")
    .sort((a, b) => compareDesc(parseDate(a.date), parseDate(b.date)));

  const effectiveDateStr =
    alterations.length > 0 ? alterations[0].date : originalEndValidity?.date;

  if (!effectiveDateStr) return false;
  if (effectiveDateStr === "vigência condicionada") return true;

  const effectiveDate = parseDate(effectiveDateStr);
  return !isAfter(effectiveDate, new Date());
}

export function groupSituationsForElement(
  element: NormativeElementEntity,
): SituationGroup[] {
  if (!element.specialSituations || element.specialSituations.length === 0)
    return [];

  const byType: Record<string, SpecialSituation[]> = {};

  element.specialSituations.forEach((sit) => {
    const typeClass = SITUATION_TYPE_MAP[sit.type] || "OTHER";
    if (!byType[typeClass]) byType[typeClass] = [];
    byType[typeClass].push(sit);
  });

  const result: SituationGroup[] = [];

  Object.entries(byType).forEach(([typeClass, sits]) => {
    sits.sort((a, b) => compareAsc(parseDate(a.date), parseDate(b.date)));
    const latestDate = parseDate(sits[sits.length - 1].date);

    result.push({
      id: `${element.id}-${typeClass}`,
      elementId: element.id,
      elementKey: `${element.type} ${element.index || ""}`,
      type: typeClass as SituationGroupType,
      situations: sits,
      latestDate,
    });
  });

  // Sort groups: newest first
  result.sort((a, b) => compareDesc(a.latestDate, b.latestDate));
  return result;
}

/**
 * Calculates display style for a normative element based on its situations.
 */
export function getElementStyle(
  element: NormativeElementEntity,
  originalEndValidity?: any,
): {
  color?: string;
  textDecoration?: string;
  fontWeight?: string;
} {
  const situations = element.specialSituations || [];

  // Check for Repristination/Restoration/Derrubada logic
  const repristination = situations.find((s) => s.type === "Repristinação");
  const restoration = situations.find(
    (s) => s.type === "Restauração de vigor/eficácia",
  );
  const derrubada = situations.find((s) => s.type === "Derrubada de veto");

  let isRepristinatedActive = false;
  if (repristination) {
    const d = parseDate(repristination.date);
    if (!isAfter(d, new Date())) isRepristinatedActive = true;
  }

  let isRestoredEfficacyActive = false;
  if (restoration) {
    const d = parseDate(restoration.date);
    if (!isAfter(d, new Date())) isRestoredEfficacyActive = true;
  }

  let isDerrubadaActive = false;
  if (derrubada) {
    const d = parseDate(derrubada.date);
    if (!isAfter(d, new Date())) isDerrubadaActive = true;
  }

  const isFuture = isValidityNotStarted(element);
  const isExpired = isValidityEnded(element, originalEndValidity);

  // Check if there is a future revocation/anulação/cassação that hasn't entered in force yet
  const futureRevocation = situations.find(
    (s) =>
      ["Revogação", "Anulação", "Cassação"].includes(s.type) &&
      s.date &&
      s.date !== "vigência condicionada" &&
      isAfter(parseDate(s.date), new Date()),
  );

  const activeRevocation = situations.find(
    (s) =>
      [
        "Revogação",
        "Anulação",
        "Cassação",
        "Perda definitiva de vigor/eficácia",
        "Suspensão de vigor/eficácia",
      ].includes(s.type) &&
      (!s.date ||
        s.date === "vigência condicionada" ||
        !isAfter(parseDate(s.date), new Date())),
  );

  const hasVeto = situations.some((s) => s.type === "Veto");

  const hasOrangeBase =
    (hasVeto && isDerrubadaActive) ||
    (!hasVeto && (isRepristinatedActive || isRestoredEfficacyActive));

  const hasNew = situations.some(
    (s) =>
      s.type === "Nova redação" ||
      s.type === "Acréscimo" ||
      s.type === "Renumeração" ||
      s.type === "Alteração de ementa",
  );

  const hasInterpretation = situations.some(
    (s) =>
      s.type === "Interpretação conforme à Constituição" ||
      s.type === "Declaração de inconstitucionalidade sem redução de texto",
  );

  // Future validity or future revocation not yet in force: red text without strike-through
  if (isFuture || futureRevocation) {
    return { color: "red" };
  }

  // Active extinction / revocation / veto: struck-through while preserving color
  const isRevocationUndone =
    (isRepristinatedActive && activeRevocation?.type === "Revogação") ||
    (isRestoredEfficacyActive &&
      activeRevocation?.type === "Suspensão de vigor/eficácia");

  const isStruck =
    (hasVeto && !isDerrubadaActive) ||
    ((isExpired || Boolean(activeRevocation)) && !isRevocationUndone);

  if (isStruck) {
    if (hasOrangeBase) {
      return { color: "orange", textDecoration: "line-through" };
    }
    if (hasNew) {
      return {
        color: "blue",
        textDecoration: "line-through",
        fontWeight: "bold",
      };
    }
    return { textDecoration: "line-through" };
  }

  // Active in force
  if (hasNew) {
    return { color: "blue", fontWeight: "bold" };
  }

  if (hasOrangeBase || isDerrubadaActive || isRepristinatedActive || isRestoredEfficacyActive) {
    return { color: "orange" };
  }

  if (hasInterpretation) {
    return { textDecoration: "underline" };
  }

  return {};
}
