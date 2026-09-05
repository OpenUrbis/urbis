import { compareDesc, format, isValid, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { OriginalNormativo, Validity } from "./types";

export const CONDITIONAL_VALIDITY = "vigência condicionada";

export function isConditionalValidity(value?: string): boolean {
  return value?.trim().toLowerCase() === CONDITIONAL_VALIDITY;
}

function parseValidityDate(value?: string): Date {
  if (!value || isConditionalValidity(value)) return new Date(0);
  const parsed = parse(value.trim(), "dd.MM.yyyy", new Date());
  return isValid(parsed) ? parsed : new Date(0);
}

function getEffectiveLinkedElementStart(
  document: OriginalNormativo,
  elementId?: string | null,
): string | undefined {
  const element = elementId
    ? document.elements?.find((candidate) => candidate.id === elementId)
    : undefined;
  const alterations = (element?.specialSituations ?? []).filter(
    (situation) => situation.type === "Vigência inicial alterada",
  );
  const conditional = alterations.filter((situation) =>
    isConditionalValidity(situation.date),
  );
  if (conditional.length > 0) {
    return CONDITIONAL_VALIDITY;
  }

  const latestAlteration = [...alterations].sort((a, b) =>
    compareDesc(parseValidityDate(a.date), parseValidityDate(b.date)),
  )[0];
  return (
    latestAlteration?.date?.trim() || element?.originalStartValidity?.date?.trim()
  );
}

export function createEmptyValidity(): Validity {
  return {
    date: "",
    deviceId: "",
    normativeElementId: "",
  };
}

export function hasValidityValue(validity?: Partial<Validity>): boolean {
  return Boolean(
    validity?.date || validity?.normativeElementId || validity?.deviceId,
  );
}

export function resolveLinkedElementDate(
  document?: OriginalNormativo | null,
  elementId?: string | null,
): string {
  if (!document) return "";

  const linkedElementDate = getEffectiveLinkedElementStart(document, elementId);
  if (linkedElementDate) return linkedElementDate;

  // A document validity is not the same thing as the act date. Prefer the
  // explicitly configured validity and only then fall back to publication/act
  // metadata for legacy documents that have no validity field.
  return (
    document.originalStartValidity?.date?.trim() ||
    document.publicationDate?.trim() ||
    document.actDate?.trim() ||
    ""
  );
}

export function updateValidityNormativeElement(
  validity: Validity | undefined,
  normativeElementId: string,
  linkedLabel?: string,
  linkedDate?: string,
): Validity {
  const current = validity ?? createEmptyValidity();
  return {
    ...current,
    normativeElementId,
    deviceId: normativeElementId
      ? (linkedLabel ?? current.deviceId ?? "")
      : "",
    date: normativeElementId
      ? (linkedDate ?? current.date ?? "")
      : (current.date ?? ""),
  };
}

export function formatValidityDate(dateStr?: string, full = false): string {
  if (!dateStr) return "sem data";

  try {
    const parsed = parse(dateStr, "dd.MM.yyyy", new Date());
    if (!isValid(parsed)) return dateStr;

    if (full) {
      return format(parsed, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
    }

    return format(parsed, "dd.MM.yyyy");
  } catch {
    return dateStr;
  }
}

export function formatValidityDisplay(validity?: Validity): string {
  if (!validity) return "não definida";

  const parts = [formatValidityDate(validity.date)];
  const normativeElementId = validity.normativeElementId?.trim();
  const legacyDevice = validity.deviceId?.trim();

  if (normativeElementId) {
    parts.push(`elemento: ${normativeElementId}`);
  } else if (legacyDevice) {
    parts.push(`dispositivo: ${legacyDevice}`);
  }

  return parts.join(" · ");
}
