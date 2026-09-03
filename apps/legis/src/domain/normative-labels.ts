import { format, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NORMATIVE_TYPES } from "@/data/normative-types";

type AuthorityShortLabelInput =
  | {
      commonRefAbbr: string;
      complementAbbr?: string;
    }
  | null
  | undefined;

type AuthorityFullLabelInput =
  | {
      commonRefFull: string;
      complementFull?: string;
    }
  | null
  | undefined;

/** Data no padrão Legis: "1 de janeiro de 2026" (entrada esperada em dd.MM.yyyy). */
export const formatNormativeDate = (dateStr?: string) => {
  if (!dateStr) return "";
  try {
    const parsed = parse(dateStr, "dd.MM.yyyy", new Date());
    if (!isValid(parsed)) return dateStr;
    return format(parsed, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return dateStr;
  }
};

export const getAuthorityShortLabel = (authority?: AuthorityShortLabelInput) =>
  authority?.commonRefAbbr || authority?.complementAbbr || "";

export const getAuthorityFullLabel = (authority?: AuthorityFullLabelInput) =>
  authority
    ? [authority.complementFull, authority.commonRefFull]
        .filter(Boolean)
        .join(" - ")
    : "";

export const getNormativeYear = (dateStr?: string) => {
  if (!dateStr) return "";
  try {
    const parsed = parse(dateStr, "dd.MM.yyyy", new Date());
    if (!isValid(parsed)) {
      const matchedYear = dateStr.match(/(\d{4})$/);
      return matchedYear?.[1] ?? "";
    }
    return format(parsed, "yyyy");
  } catch {
    const matchedYear = dateStr.match(/(\d{4})$/);
    return matchedYear?.[1] ?? "";
  }
};

export const getNormativeTypeLabel = (normativeType?: string) =>
  (normativeType &&
    NORMATIVE_TYPES[normativeType as keyof typeof NORMATIVE_TYPES]) ||
  normativeType ||
  "";

/**
 * Referência textual no padrão Legis, sem a autoridade:
 * "Lei nº 123/2026".
 */
export const getNormativeDesignation = (doc: {
  normativeType?: string;
  number?: string;
  actDate?: string;
  publicationDate?: string;
}) => {
  const typeLabel = getNormativeTypeLabel(doc.normativeType);
  if (!doc.number) return typeLabel;

  const year = getNormativeYear(doc.actDate || doc.publicationDate);
  return `${typeLabel} nº ${doc.number}${year ? `/${year}` : ""}`.trim();
};
