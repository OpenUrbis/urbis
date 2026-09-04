import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import type {
  NormativeElementEntity,
  OriginalNormativo,
} from "../../domain/entities";
import { getSegmentBaseText } from "../../domain/segment-anchor";
import { htmlToPlainText } from "../../domain/text-utils";
import {
  pageService,
  type NormativeSearchResult,
  type SearchCondition,
} from "../../services/page-service";
import type { LinkTreeDocument, LinkTreeElement } from "./link-tree";

export interface UseLinkSearchOptions {
  open: boolean;
  /** Busca simples (campo único). */
  term: string;
  /** Filtros avançados; vazio = só o termo simples. */
  conditions?: SearchCondition[];
  /** Elementos do documento atual, para busca local. */
  localElements?: NormativeElementEntity[];
  /**
   * Documentos que precisam estar no cache: os vínculos já existentes na
   * abertura e, depois, os documentos que o usuário expandir. Nada é
   * pré-carregado além disso.
   */
  preloadDocumentIds?: string[];
}

export interface UseLinkSearchResult {
  documents: LinkTreeDocument[];
  docCache: Record<string, OriginalNormativo>;
  isSearching: boolean;
  error: string | null;
  retry: () => void;
}

export const LOCAL_DOCUMENT_ID = "current";

const SEARCH_DEBOUNCE_MS = 400;
const ID_SEPARATOR = "\u0000";

const SEARCH_ERROR =
  "Não foi possível concluir a busca. Verifique a conexão e tente novamente.";
const DOCUMENT_ERROR =
  "Não foi possível carregar a estrutura de um dos documentos.";

/* -------------------------------------------------------------------------- */
/* Query building                                                              */
/* -------------------------------------------------------------------------- */

export function buildConditions(
  term: string,
  conditions: SearchCondition[],
): SearchCondition[] {
  const active: SearchCondition[] = [];

  if (term) {
    active.push({
      id: "simple-term",
      field: "term",
      operator: "contains",
      value: term,
      connector: "AND",
    });
  }

  conditions
    .filter((condition) => condition.value.trim() !== "")
    .forEach((condition) =>
      active.push({ ...condition, value: condition.value.trim() }),
    );

  return active;
}

/* -------------------------------------------------------------------------- */
/* Local search                                                                */
/* -------------------------------------------------------------------------- */

function normalizeSearchText(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function matchesTerm(
  element: NormativeElementEntity,
  condition: SearchCondition,
): boolean {
  const plainText = htmlToPlainText(element.text);
  const type = element.type ?? "";
  const index = element.index ?? "";

  const haystacks = [
    plainText,
    type,
    index,
    index ? `${index}) ${plainText}` : "",
    index ? `${index}. ${plainText}` : "",
    index ? `${index} - ${plainText}` : "",
    type ? `${type} ${index} ${plainText}` : "",
  ]
    .filter(Boolean)
    .map((value) => value.toLowerCase());

  const needle = condition.value.toLowerCase();
  const normalizedNeedle = normalizeSearchText(condition.value);

  const checkMatch = (haystack: string) => {
    switch (condition.operator) {
      case "equals":
        return (
          haystack.trim() === needle ||
          normalizeSearchText(haystack) === normalizedNeedle
        );
      case "not_contains":
        return (
          !haystack.includes(needle) &&
          !normalizeSearchText(haystack).includes(normalizedNeedle)
        );
      case "greater":
      case "less":
        return true;
      case "contains":
      default:
        return (
          haystack.includes(needle) ||
          normalizeSearchText(haystack).includes(normalizedNeedle)
        );
    }
  };

  return haystacks.some(checkMatch);
}

function matchesLocalCondition(
  element: NormativeElementEntity,
  condition: SearchCondition,
): boolean {
  // Metadados do documento (tipo normativo, data, autor) não existem no
  // escopo local: a condição não filtra nada em vez de zerar o resultado.
  if (condition.field !== "term") return true;
  return matchesTerm(element, condition);
}

export function searchLocalElements(
  elements: NormativeElementEntity[],
  conditions: SearchCondition[],
): NormativeSearchResult[] {
  if (!conditions.length) return [];

  return elements
    .filter((element) =>
      conditions.reduce((accumulated, condition, conditionIndex) => {
        const matches = matchesLocalCondition(element, condition);
        if (conditionIndex === 0) return matches;
        return condition.connector === "OR"
          ? accumulated || matches
          : accumulated && matches;
      }, true),
    )
    .map((element) => ({
      pageId: LOCAL_DOCUMENT_ID,
      pageTitle: "Documento atual",
      elementId: element.id,
      type: element.type,
      index: element.index,
      text: element.text,
    }));
}

function buildLocalDocument(
  elements: NormativeElementEntity[],
): OriginalNormativo {
  return {
    id: LOCAL_DOCUMENT_ID,
    type: "original_normativo",
    normativeType: "L",
    authorityId: LOCAL_DOCUMENT_ID,
    ementa: "Documento atual",
    elements,
    sources: [],
    createdAt: "",
    updatedAt: "",
  };
}

/* -------------------------------------------------------------------------- */
/* Combined search                                                             */
/* -------------------------------------------------------------------------- */

export interface LinkSearchOutcome {
  results: NormativeSearchResult[];
  error: string | null;
}

/**
 * Runs both scopes and merges them.
 *
 * The two scopes are additive: treating them as an either/or silently disabled
 * the remote search whenever the caller supplied `localElements`, so nothing
 * outside the current document could ever be found.
 */
export async function runLinkSearch(
  elements: NormativeElementEntity[] | undefined,
  conditions: SearchCondition[],
  onLocalResults?: (results: NormativeSearchResult[]) => void,
): Promise<LinkSearchOutcome> {
  const localFound = elements ? searchLocalElements(elements, conditions) : [];

  // Local matches are synchronous: surface them before the network answers.
  if (localFound.length) onLocalResults?.(localFound);

  try {
    const remoteFound = await pageService.searchNormativeElements({
      conditions,
    });
    const localIds = new Set(localFound.map((result) => result.elementId));

    return {
      results: [
        ...localFound,
        ...remoteFound.filter((result) => !localIds.has(result.elementId)),
      ],
      error: null,
    };
  } catch {
    // Keep whatever the local scope found; the failure was remote.
    return { results: localFound, error: SEARCH_ERROR };
  }
}

/* -------------------------------------------------------------------------- */
/* Mapping                                                                     */
/* -------------------------------------------------------------------------- */

const elementMappingCache = new WeakMap<
  NormativeElementEntity[],
  LinkTreeElement[]
>();

/** Cached by array identity so the tree index is not rebuilt on every render. */
function toLinkTreeElements(
  elements: NormativeElementEntity[],
): LinkTreeElement[] {
  const cached = elementMappingCache.get(elements);
  if (cached) return cached;

  const mapped = elements.map<LinkTreeElement>((element) => ({
    id: element.id,
    type: element.type,
    index: element.index,
    // Mesma base canônica usada pelos offsets de trecho.
    text: getSegmentBaseText(element),
    parentId: element.parentId,
  }));

  elementMappingCache.set(elements, mapped);
  return mapped;
}

function formatDocumentLabel(
  document: OriginalNormativo | undefined,
  docId: string,
): string {
  if (!document) return `Documento ${docId.substring(0, 8)}`;
  if (document.number) return `${document.normativeType} ${document.number}`;
  if (document.ementa) return document.ementa.substring(0, 80);
  return `Documento ${docId.substring(0, 8)}`;
}

/* -------------------------------------------------------------------------- */
/* Hook                                                                        */
/* -------------------------------------------------------------------------- */

export function useLinkSearch({
  open,
  term,
  conditions,
  localElements,
  preloadDocumentIds,
}: UseLinkSearchOptions): UseLinkSearchResult {
  const [results, setResults] = useState<NormativeSearchResult[]>([]);
  const [docCache, setDocCache] = useState<Record<string, OriginalNormativo>>(
    {},
  );
  const [loadingDocIds, setLoadingDocIds] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  // Refs (e não estado) para o controle de prefetch: o efeito não precisa mais
  // depender de `docCache`/`loadingDocs`, o que eliminava o refetch do mesmo
  // documento por causa de closure obsoleta.
  const docCacheRef = useRef<Record<string, OriginalNormativo>>({});
  const loadingDocsRef = useRef<Set<string>>(new Set());
  const localElementsRef = useRef<NormativeElementEntity[] | undefined>(
    localElements,
  );
  localElementsRef.current = localElements;

  const querySignature = useMemo(
    () => JSON.stringify({ term: term.trim(), conditions: conditions ?? [] }),
    [term, conditions],
  );
  const debouncedSignature = useDebounce(querySignature, SEARCH_DEBOUNCE_MS);
  const activeConditions = useMemo(() => {
    const parsed = JSON.parse(debouncedSignature) as {
      term: string;
      conditions: SearchCondition[];
    };
    return buildConditions(parsed.term, parsed.conditions);
  }, [debouncedSignature]);

  const localElementsKey = useMemo(
    () =>
      localElements
        ? localElements.map((element) => element.id).join(ID_SEPARATOR)
        : "",
    [localElements],
  );
  const hasLocalElements = Boolean(localElements);

  const preloadKey = useMemo(
    () => (preloadDocumentIds ?? []).filter(Boolean).join(ID_SEPARATOR),
    [preloadDocumentIds],
  );
  const preloadIds = useMemo(
    () =>
      preloadKey ? Array.from(new Set(preloadKey.split(ID_SEPARATOR))) : [],
    [preloadKey],
  );

  const loadDocument = useCallback(async (docId: string) => {
    if (!docId || docId === LOCAL_DOCUMENT_ID) return;
    if (docCacheRef.current[docId] || loadingDocsRef.current.has(docId)) return;

    loadingDocsRef.current.add(docId);
    setLoadingDocIds(Array.from(loadingDocsRef.current));

    try {
      const page = await pageService.getById(docId);
      if (page && page.type === "original_normativo" && page.entity) {
        docCacheRef.current = {
          ...docCacheRef.current,
          [docId]: page.entity as OriginalNormativo,
        };
        setDocCache(docCacheRef.current);
      }
    } catch {
      setError(DOCUMENT_ERROR);
    } finally {
      loadingDocsRef.current.delete(docId);
      setLoadingDocIds(Array.from(loadingDocsRef.current));
    }
  }, []);

  // Documento local: entra no cache para que a árvore e o resumo de vínculos
  // encontrem a estrutura sem nenhuma requisição.
  useEffect(() => {
    const elements = localElementsRef.current;
    if (!elements) return;

    docCacheRef.current = {
      ...docCacheRef.current,
      [LOCAL_DOCUMENT_ID]: buildLocalDocument(elements),
    };
    setDocCache(docCacheRef.current);
  }, [localElementsKey, hasLocalElements]);

  useEffect(() => {
    if (!open || !activeConditions.length) {
      setResults([]);
      setError(null);
      setIsSearching(false);
      return;
    }

    // A stale run is invalidated by the effect's own cleanup. The previous
    // "mounted" ref could never be restored after StrictMode's double mount,
    // which left every response discarded and the spinner stuck forever.
    let cancelled = false;

    setIsSearching(true);
    setError(null);

    void (async () => {
      const { results: found, error: searchError } = await runLinkSearch(
        localElementsRef.current,
        activeConditions,
        (localResults) => {
          if (!cancelled) setResults(localResults);
        },
      );

      if (cancelled) return;

      setResults(found);
      setError(searchError);
      setIsSearching(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, activeConditions, localElementsKey, hasLocalElements, retryToken]);

  // Carrega sob demanda: vínculos pré-existentes na abertura e, depois, cada
  // documento que o consumidor expandir.
  useEffect(() => {
    if (!open) return;
    preloadIds.forEach((docId) => {
      void loadDocument(docId);
    });
  }, [open, preloadIds, loadDocument, retryToken]);

  const documents = useMemo<LinkTreeDocument[]>(() => {
    const order: string[] = [];
    const grouped = new Map<string, NormativeSearchResult[]>();

    results.forEach((result) => {
      const group = grouped.get(result.pageId);
      if (group) {
        group.push(result);
        return;
      }
      grouped.set(result.pageId, [result]);
      order.push(result.pageId);
    });

    preloadIds.forEach((docId) => {
      if (grouped.has(docId)) return;
      grouped.set(docId, []);
      order.push(docId);
    });

    const loading = new Set(loadingDocIds);
    const isSearchActive = activeConditions.length > 0;

    return (
      order
        // While a search is active, the current document is only listed when it
        // actually matched. Otherwise it showed up empty next to the results and
        // read as "nothing was found".
        .filter((docId) => {
          if (docId !== LOCAL_DOCUMENT_ID) return true;
          if (!isSearchActive) return true;
          return (grouped.get(docId) ?? []).length > 0;
        })
        .map((docId) => {
          const document = docCache[docId];
          const group = grouped.get(docId) ?? [];

          return {
            id: docId,
            label: group[0]?.pageTitle || formatDocumentLabel(document, docId),
            elements: document ? toLinkTreeElements(document.elements) : [],
            matchedElementIds: group.map((result) => result.elementId),
            isLoading: loading.has(docId),
          };
        })
    );
  }, [results, preloadIds, docCache, loadingDocIds, activeConditions]);

  const retry = useCallback(() => {
    setError(null);
    setRetryToken((previous) => previous + 1);
  }, []);

  return { documents, docCache, isSearching, error, retry };
}
