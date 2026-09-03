import { NormativeElementEntity as NormativeElement } from "./entities";

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeNumericOrdinalIndex(index?: string): string {
  if (!index) return "";

  const normalized = index.trim().replace(/\./g, "");
  const match = normalized.match(/^(\d+)(?:\s*[º°oᵒ∘ª])?$/i);

  if (!match) return normalized;

  const numeric = String(parseInt(match[1], 10));
  const value = Number(numeric);

  return value >= 1 && value <= 9 ? `${numeric}º` : numeric;
}

function isHierarchicalDottedIndex(index?: string): boolean {
  return !!index && /^\d+(?:\.[A-Za-z0-9]+)+\.?$/.test(index.trim());
}

type ListSeparator = "dash" | "dot" | "paren" | "none";

function inferLeadingListSeparator(
  index?: string,
  text?: string,
): ListSeparator | undefined {
  const safeIndex = index?.trim();
  const safeText = text?.trim();

  if (!safeIndex || !safeText) return undefined;

  const INTERSTITIAL = "(?:<[^>]+>|&nbsp;|[\\s\\u00A0])*";
  const indexPattern = Array.from(safeIndex).reduce((acc, token) => {
    if (/\s/.test(token)) {
      return `${acc}${INTERSTITIAL}`;
    }

    return `${acc}${escapeRegex(token)}${INTERSTITIAL}`;
  }, "");

  const match = safeText.match(
    new RegExp(
      `^${INTERSTITIAL}${indexPattern}([.)]|[-–—])?${INTERSTITIAL}`,
      "i",
    ),
  );

  const separator = match?.[1];

  if (!separator) return "none";
  if (separator === ".") return "dot";
  if (separator === ")") return "paren";
  return "dash";
}

function ensureTrailingDot(index: string): string {
  return index.trim().endsWith(".") ? index.trim() : `${index.trim()}.`;
}

function getIndexedListKey(
  type: "Inciso" | "Item" | "Alínea",
  index?: string,
  text?: string,
): string {
  const safeIndex = index?.trim();

  if (!safeIndex) return "";

  const separator = inferLeadingListSeparator(safeIndex, text);
  const hierarchicalIndex = isHierarchicalDottedIndex(safeIndex);

  if (separator === "dot") {
    return `${hierarchicalIndex ? ensureTrailingDot(safeIndex) : safeIndex + "."} `;
  }

  if (separator === "paren") {
    return `${safeIndex}) `;
  }

  if (separator === "dash") {
    return `${safeIndex} - `;
  }

  if (hierarchicalIndex) {
    return `${ensureTrailingDot(safeIndex)} `;
  }

  if (type === "Alínea") {
    return `${safeIndex}) `;
  }

  return `${safeIndex} - `;
}

export function getElementKey(element: NormativeElement): string {
  const { type, index, text } = element;

  switch (type) {
    case "Parte":
      return index ? `${type} ${index} - ` : `${type} `;

    case "Livro":
    case "Título":
    case "Capítulo":
    case "Seção":
    case "Subseção":
      return `${type} ${index ? index : ""} - `;

    case "Artigo":
      return `Art. ${normalizeNumericOrdinalIndex(index)} `;

    case "Parágrafo":
      if (
        index === "único" ||
        (text && text.toLowerCase().startsWith("único"))
      ) {
        return "Parágrafo único. ";
      }
      return `§ ${normalizeNumericOrdinalIndex(index)} `;

    case "Inciso":
      return getIndexedListKey("Inciso", index, text);

    case "Item":
      return getIndexedListKey("Item", index, text);

    case "Alínea":
      return getIndexedListKey("Alínea", index, text);

    case "Divisão desconforme":
    case "Elemento desconforme":
      return "";

    case "Tabela":
    case "Figura":
    case "Mapa":
      return index ? `${type} ${index} - ` : `${type} `;

    case "Nota":
      return `(${index}) - `;

    default:
      return "";
  }
}
