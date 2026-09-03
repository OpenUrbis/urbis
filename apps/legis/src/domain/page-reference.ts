import type { Page } from "../types/page";
import type { ColetaneaTematica, OriginalNormativo } from "./entities";
import { getNormativeDesignation } from "./normative-labels";

export interface PageReference {
  id: string;
  /** Referência curta para leitura, ex. "Lei nº 16.402/2016". */
  label: string;
  /** Título completo da página, para tooltip. */
  title: string;
  /** Destino para abrir a página. */
  href: string;
}

const MAX_LABEL_LENGTH = 70;

const truncate = (value: string) =>
  value.length > MAX_LABEL_LENGTH
    ? `${value.slice(0, MAX_LABEL_LENGTH).trimEnd()}…`
    : value;

/**
 * Referência de leitura de uma página. Originais normativos usam a designação do
 * Legis ("Decreto nº 57.776/2017"); o resto usa o próprio título. Em nenhum caso
 * o identificador técnico vira texto visível.
 */
export function formatPageReference(page: Page): PageReference {
  const title = page.title?.trim() || "Sem título";

  const normative =
    page.type === "original_normativo"
      ? (page.entity as OriginalNormativo | undefined)
      : undefined;
  const coletanea =
    page.type === "coletanea_tematica"
      ? (page.entity as ColetaneaTematica | undefined)
      : undefined;

  const designation = normative?.number
    ? getNormativeDesignation(normative)
    : "";
  const label = designation || coletanea?.title?.trim() || title;

  return {
    id: page.id,
    label: truncate(label),
    title,
    href: `/pages/${page.id}`,
  };
}
