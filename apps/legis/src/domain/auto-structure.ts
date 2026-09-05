import { ElementType } from "./entities";

const HIERARCHICAL_NUMERIC_SCOPE_BREAKERS = new Set<ElementType>([
  "Parte",
  "Livro",
  "Título",
  "Capítulo",
  "Seção",
  "Subseção",
  "Artigo",
  "Parágrafo",
  "Anexo",
]);

const STRUCTURAL_LINE_BREAK =
  /\r\n?|[\n\u000b\u000c\u0085\u2028\u2029]/; // eslint-disable-line no-control-regex -- document line-break separators

export function getFirstAutoStructureLine(text?: string): string {
  if (!text) return "";

  return text.split(STRUCTURAL_LINE_BREAK).find((line) => line.trim()) || "";
}

function buildTypedIndexedParentKey(
  type: "Item" | "Inciso",
  index: string,
): string {
  return `${type}:${index}`;
}

function getIndexedParentByType(
  indexedParents: ReadonlyMap<string, string>,
  type: "Item" | "Inciso",
  index: string | undefined,
): string | undefined {
  const normalized = normalizeHierarchicalDottedIndex(index) ?? index?.trim();

  if (!normalized || STRUCTURAL_LINE_BREAK.test(normalized)) {
    return undefined;
  }

  return indexedParents.get(buildTypedIndexedParentKey(type, normalized));
}

function isSameOrAncestorIndex(candidate: string, current: string): boolean {
  return candidate === current || current.startsWith(`${candidate}.`);
}

function pruneIndexedParentsToActiveBranch(
  indexedParents: Map<string, string>,
  currentIndex: string,
  typesToPrune: Array<"Item" | "Inciso">,
): void {
  for (const key of Array.from(indexedParents.keys())) {
    const separatorIndex = key.indexOf(":");

    if (separatorIndex === -1) {
      continue;
    }

    const entryType = key.slice(0, separatorIndex) as "Item" | "Inciso";
    const entryIndex = key.slice(separatorIndex + 1);

    if (!typesToPrune.includes(entryType)) {
      continue;
    }

    if (!isSameOrAncestorIndex(entryIndex, currentIndex)) {
      indexedParents.delete(key);
    }
  }
}

export function isHierarchicalNumericIndex(index?: string): boolean {
  return !!index && /^\d+(?:\.\d+)+\.?$/.test(index.trim());
}

function isHierarchicalDottedIndex(index?: string): boolean {
  return !!index && /^\d+(?:\.[A-Za-z0-9]+)+\.?$/.test(index.trim());
}

function normalizeHierarchicalDottedIndex(index?: string): string | undefined {
  const trimmed = index?.trim();

  if (!trimmed || STRUCTURAL_LINE_BREAK.test(trimmed)) {
    return undefined;
  }

  const segments = trimmed
    .split(".")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => segment.toUpperCase());

  return segments.length ? segments.join(".") : undefined;
}

export function normalizeHierarchicalNumericIndex(
  index?: string,
): string | undefined {
  const normalized = normalizeHierarchicalDottedIndex(index);
  return normalized && /^\d+(?:\.\d+)+$/.test(normalized)
    ? normalized
    : undefined;
}

export function getImmediateHierarchicalParentIndex(
  index?: string,
): string | undefined {
  const normalized = normalizeHierarchicalDottedIndex(index);

  if (!normalized || !normalized.includes(".")) {
    return undefined;
  }

  const segments = normalized.split(".");
  return segments.length > 1 ? segments.slice(0, -1).join(".") : undefined;
}

export function shouldClearHierarchicalNumericParents(
  type: ElementType,
): boolean {
  return HIERARCHICAL_NUMERIC_SCOPE_BREAKERS.has(type);
}

export function registerHierarchicalNumericParent(
  indexedParents: Map<string, string>,
  type: ElementType,
  index: string | undefined,
  id: string,
): void {
  if (type === "Item") {
    const normalized = normalizeHierarchicalDottedIndex(index) ?? index?.trim();

    if (normalized && !STRUCTURAL_LINE_BREAK.test(normalized)) {
      pruneIndexedParentsToActiveBranch(indexedParents, normalized, [
        "Item",
        "Inciso",
      ]);
      indexedParents.set(buildTypedIndexedParentKey("Item", normalized), id);
    }

    return;
  }

  if (type === "Inciso" && isHierarchicalNumericIndex(index)) {
    const normalized = normalizeHierarchicalNumericIndex(index);
    if (normalized) {
      pruneIndexedParentsToActiveBranch(indexedParents, normalized, ["Inciso"]);
      indexedParents.set(buildTypedIndexedParentKey("Inciso", normalized), id);
    }
  }
}

export function resolveHierarchicalNumericParentId(
  type: ElementType,
  index: string | undefined,
  indexedParents: ReadonlyMap<string, string>,
): string | undefined {
  if (type === "Item") {
    if (!isHierarchicalDottedIndex(index)) {
      return undefined;
    }

    const parentIndex = getImmediateHierarchicalParentIndex(index);

    if (!parentIndex) {
      return undefined;
    }

    return getIndexedParentByType(indexedParents, "Item", parentIndex);
  }

  if (type !== "Inciso" || !isHierarchicalNumericIndex(index)) {
    return undefined;
  }

  const parentIndex = getImmediateHierarchicalParentIndex(index);

  if (!parentIndex) {
    return undefined;
  }

  return (
    getIndexedParentByType(indexedParents, "Inciso", parentIndex) ??
    getIndexedParentByType(indexedParents, "Item", parentIndex)
  );
}
