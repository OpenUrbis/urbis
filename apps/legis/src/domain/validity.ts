import { format, isValid, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { OriginalNormativo, Validity } from "./types";

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

  if (elementId) {
    const element = document.elements?.find((e) => e.id === elementId);
    if (element?.originalStartValidity?.date?.trim()) {
      return element.originalStartValidity.date.trim();
    }
  }

  const generalDate =
    document.actDate?.trim() ||
    document.publicationDate?.trim() ||
    document.originalStartValidity?.date?.trim() ||
    "";

  return generalDate;
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
