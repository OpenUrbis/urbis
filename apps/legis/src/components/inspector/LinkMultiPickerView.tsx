import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Input, cn } from "@open-urbis/map-ui";
import { AlertCircle, FileText, Loader2, Search, X } from "lucide-react";
import type {
  CollectionLink,
  NormativeElementEntity,
  OriginalNormativo,
} from "../../domain/entities";
import type { AnnotatedTextSegment } from "../../domain/types";
import {
  getSegmentBaseText,
  withSegmentAnchor,
} from "../../domain/segment-anchor";
import { LinkTree, type LinkTreeDocument } from "../collection/link-tree";
import {
  LOCAL_DOCUMENT_ID,
  useLinkSearch,
} from "../collection/use-link-search";
import {
  InspectorEmpty,
  InspectorSection,
  InspectorView,
} from "./InspectorShell";
import { formatDeviceLabel, resolveDocumentLabel } from "./LinkPickerView";
import { ui } from "./inspector-tokens";

/**
 * Multiple-selection of normative links as an inspector view.
 *
 * Replaces the `CollectionLinkManager` dialog. The selection lives in a local
 * draft that is only handed to the caller on confirmation, together with the
 * document cache the caller needs to label and sort the links.
 */

export interface LinkMultiPickerViewProps {
  title?: string;
  /** Vínculos já existentes (edição de um nó reference) ou [] para novo. */
  initialLinks: CollectionLink[];
  localElements?: NormativeElementEntity[];
  /** Confirma a seleção. O cache é necessário para o chamador rotular e ordenar. */
  onConfirm: (
    links: CollectionLink[],
    cache: Record<string, OriginalNormativo>,
  ) => void;
  onBack: () => void;
  onToggleCollapse?: () => void;
  /**
   * Abre a marcação de trechos de um elemento vinculado. Quando ausente,
   * a ação de marcar trecho não aparece.
   */
  onRequestSegments?: (request: {
    documentId: string;
    elementId: string;
    elementLabel: string;
    baseText: string;
    segments: AnnotatedTextSegment[];
    onResolve: (segments: AnnotatedTextSegment[]) => void;
  }) => void;
}

type LinkedElementDraft = NonNullable<CollectionLink["linkedElements"]>[number];

/** parentId -> childIds */
export type ChildIndex = Map<string, string[]>;

export type SegmentsLookup = (
  elementId: string,
) => AnnotatedTextSegment[] | undefined;

export interface LinkSelectionUpdate {
  links: CollectionLink[];
  /** Trechos dos elementos que saíram da seleção, para restaurar ao remarcar. */
  preservedSegments: Array<[string, AnnotatedTextSegment[]]>;
}

export interface LinkSelectionSummary {
  selectedElementIds: string[];
  /** Elementos com descendentes onde só o caput está vinculado. */
  indeterminateElementIds: string[];
  elementIdsWithSegments: string[];
}

export interface SelectedGroupElement {
  elementId: string;
  label: string;
  segmentCount: number;
}

export interface SelectedGroup {
  documentId: string;
  documentLabel: string;
  /** Vínculo legado que aponta para o documento inteiro. */
  wholeDocument: boolean;
  elements: SelectedGroupElement[];
}

/* -------------------------------------------------------------------------- */
/* Hierarchy                                                                   */
/* -------------------------------------------------------------------------- */

export function buildChildIndex(
  elements: NormativeElementEntity[],
): ChildIndex {
  const index: ChildIndex = new Map();

  elements.forEach((element) => {
    if (!element.parentId) return;
    const children = index.get(element.parentId);
    if (children) children.push(element.id);
    else index.set(element.parentId, [element.id]);
  });

  return index;
}

export function collectDescendants(
  index: ChildIndex,
  elementId: string,
): string[] {
  const descendants: string[] = [];
  const stack = [...(index.get(elementId) ?? [])];

  while (stack.length) {
    const current = stack.pop() as string;
    descendants.push(current);
    const children = index.get(current);
    if (children) stack.push(...children);
  }

  return descendants;
}

/**
 * Máquina de 3 estados de qualquer elemento que tenha filhos — não só
 * Artigo/Parágrafo/Inciso, como fazia o gerenciador em modal:
 * vazio -> caput + descendentes -> só o caput -> vazio.
 *
 * Elementos-folha alternam entre vazio e selecionado.
 */
export function nextSelectionForElement(
  currentIds: Set<string>,
  elementId: string,
  descendantIds: string[],
): Set<string> {
  const next = new Set(currentIds);
  const isSelected = currentIds.has(elementId);

  if (!descendantIds.length) {
    if (isSelected) next.delete(elementId);
    else next.add(elementId);
    return next;
  }

  if (!isSelected) {
    next.add(elementId);
    descendantIds.forEach((id) => next.add(id));
    return next;
  }

  if (descendantIds.every((id) => currentIds.has(id))) {
    descendantIds.forEach((id) => next.delete(id));
    return next;
  }

  next.delete(elementId);
  descendantIds.forEach((id) => next.delete(id));
  return next;
}

/* -------------------------------------------------------------------------- */
/* Links                                                                       */
/* -------------------------------------------------------------------------- */

/** `LinkedElement.segments` é `any[]` no domínio; o cast fica confinado aqui. */
export function readLinkedSegments(
  linkedElement: LinkedElementDraft,
): AnnotatedTextSegment[] | undefined {
  const segments = linkedElement.segments as AnnotatedTextSegment[] | undefined;
  return segments && segments.length ? segments : undefined;
}

function createLinkedElement(
  elementId: string,
  segments?: AnnotatedTextSegment[],
): LinkedElementDraft {
  return segments && segments.length ? { elementId, segments } : { elementId };
}

/** Trechos já persistidos, para o rascunho começar com o que existia. */
export function collectSegmentDrafts(
  links: CollectionLink[],
): Map<string, AnnotatedTextSegment[]> {
  const drafts = new Map<string, AnnotatedTextSegment[]>();

  links.forEach((link) => {
    (link.linkedElements ?? []).forEach((linkedElement) => {
      const segments = readLinkedSegments(linkedElement);
      if (segments) drafts.set(linkedElement.elementId, segments);
    });
  });

  return drafts;
}

/**
 * Reescreve os vínculos de um documento a partir do conjunto de elementos
 * selecionados. Documentos sem elementos saem da lista, e os trechos dos
 * elementos removidos voltam em `preservedSegments` para o chamador guardar.
 */
export function rebuildDocumentLinks(
  links: CollectionLink[],
  docId: string,
  nextIds: Set<string>,
  segmentsFor: SegmentsLookup,
): LinkSelectionUpdate {
  const preservedSegments: Array<[string, AnnotatedTextSegment[]]> = [];
  const next: CollectionLink[] = [];

  links.forEach((link) => {
    if (link.resourceId !== docId) {
      next.push(link);
      return;
    }

    const kept: LinkedElementDraft[] = [];
    (link.linkedElements ?? []).forEach((linkedElement) => {
      if (nextIds.has(linkedElement.elementId)) {
        kept.push(linkedElement);
        return;
      }
      const segments = readLinkedSegments(linkedElement);
      if (segments) preservedSegments.push([linkedElement.elementId, segments]);
    });

    const keptIds = new Set(
      kept.map((linkedElement) => linkedElement.elementId),
    );
    const added = Array.from(nextIds)
      .filter((id) => !keptIds.has(id))
      .map((id) => createLinkedElement(id, segmentsFor(id)));
    const linkedElements = [...kept, ...added];

    if (linkedElements.length) next.push({ ...link, linkedElements });
  });

  const hadDocument = links.some((link) => link.resourceId === docId);
  if (!hadDocument && nextIds.size) {
    next.push({
      resourceId: docId,
      resourceType: "original_normativo",
      linkedElements: Array.from(nextIds).map((id) =>
        createLinkedElement(id, segmentsFor(id)),
      ),
    });
  }

  return { links: next, preservedSegments };
}

/** Substitui (nunca acumula) os trechos de um elemento vinculado. */
export function replaceElementSegments(
  links: CollectionLink[],
  docId: string,
  elementId: string,
  segments: AnnotatedTextSegment[],
): CollectionLink[] {
  const linkIndex = links.findIndex((link) => link.resourceId === docId);

  if (linkIndex === -1) {
    return [
      ...links,
      {
        resourceId: docId,
        resourceType: "original_normativo",
        linkedElements: [createLinkedElement(elementId, segments)],
      },
    ];
  }

  const link = links[linkIndex];
  const linkedElements = [...(link.linkedElements ?? [])];
  const elementIndex = linkedElements.findIndex(
    (linkedElement) => linkedElement.elementId === elementId,
  );

  if (elementIndex === -1)
    linkedElements.push(createLinkedElement(elementId, segments));
  else linkedElements[elementIndex] = createLinkedElement(elementId, segments);

  const next = [...links];
  next[linkIndex] = { ...link, linkedElements };
  return next;
}

export function selectedIdsForDocument(
  links: CollectionLink[],
  docId: string,
): Set<string> {
  return new Set(
    links
      .filter((link) => link.resourceId === docId)
      .flatMap((link) =>
        (link.linkedElements ?? []).map(
          (linkedElement) => linkedElement.elementId,
        ),
      ),
  );
}

export function summarizeSelection(
  links: CollectionLink[],
  docCache: Record<string, OriginalNormativo>,
  childIndexes: Map<string, ChildIndex>,
): LinkSelectionSummary {
  const selectedElementIds: string[] = [];
  const indeterminateElementIds: string[] = [];
  const elementIdsWithSegments: string[] = [];

  links.forEach((link) => {
    const linkedElements = link.linkedElements ?? [];

    if (!linkedElements.length) {
      // Vínculo legado sem elementos: o documento inteiro está vinculado.
      docCache[link.resourceId]?.elements.forEach((element) =>
        selectedElementIds.push(element.id),
      );
      return;
    }

    const linkedIds = new Set(
      linkedElements.map((linkedElement) => linkedElement.elementId),
    );
    const index = childIndexes.get(link.resourceId);

    linkedElements.forEach((linkedElement) => {
      selectedElementIds.push(linkedElement.elementId);
      if (readLinkedSegments(linkedElement))
        elementIdsWithSegments.push(linkedElement.elementId);
      if (!index) return;

      const descendants = collectDescendants(index, linkedElement.elementId);
      if (descendants.length && !descendants.every((id) => linkedIds.has(id))) {
        indeterminateElementIds.push(linkedElement.elementId);
      }
    });
  });

  return {
    selectedElementIds,
    indeterminateElementIds,
    elementIdsWithSegments,
  };
}

/** Painel de selecionados: um grupo por documento, na ordem do original. */
export function buildSelectedGroups(
  links: CollectionLink[],
  docCache: Record<string, OriginalNormativo>,
): SelectedGroup[] {
  return links.map((link) => {
    const document = docCache[link.resourceId];
    const order = new Map(
      (document?.elements ?? []).map((element, index) => [element.id, index]),
    );
    const linkedElements = link.linkedElements ?? [];

    const elements = linkedElements
      .map<SelectedGroupElement>((linkedElement) => {
        const element = document?.elements.find(
          (candidate) => candidate.id === linkedElement.elementId,
        );
        return {
          elementId: linkedElement.elementId,
          label: formatDeviceLabel(element) ?? linkedElement.elementId,
          segmentCount: readLinkedSegments(linkedElement)?.length ?? 0,
        };
      })
      .sort(
        (a, b) =>
          (order.get(a.elementId) ?? Number.MAX_SAFE_INTEGER) -
          (order.get(b.elementId) ?? Number.MAX_SAFE_INTEGER),
      );

    return {
      documentId: link.resourceId,
      documentLabel: resolveDocumentLabel(document, link.resourceId),
      wholeDocument: !linkedElements.length,
      elements,
    };
  });
}

export function formatSelectionSummary(
  elementCount: number,
  documentCount: number,
): string {
  const elements = `${elementCount} ${elementCount === 1 ? "elemento" : "elementos"}`;
  const documents = `${documentCount} ${documentCount === 1 ? "documento" : "documentos"}`;
  return `${elements} de ${documents}`;
}

/* -------------------------------------------------------------------------- */
/* View                                                                        */
/* -------------------------------------------------------------------------- */

export function LinkMultiPickerView({
  title,
  initialLinks,
  localElements,
  onConfirm,
  onBack,
  onToggleCollapse,
  onRequestSegments,
}: LinkMultiPickerViewProps) {
  const [term, setTerm] = useState("");
  const [draftLinks, setDraftLinks] = useState<CollectionLink[]>(initialLinks);
  const [expandedDocIds, setExpandedDocIds] = useState<string[]>(() =>
    initialLinks.map((link) => link.resourceId),
  );

  // Trechos de elementos temporariamente desmarcados, para não serem perdidos.
  const segmentDraftsRef = useRef<Map<string, AnnotatedTextSegment[]>>(
    collectSegmentDrafts(initialLinks),
  );

  // `initialLinks` costuma ser um literal recriado a cada render do consumidor:
  // comparar por conteúdo é o que evita zerar o rascunho a cada render do pai.
  const initialLinksSignature = useMemo(
    () => JSON.stringify(initialLinks ?? []),
    [initialLinks],
  );

  useEffect(() => {
    const parsed = JSON.parse(initialLinksSignature) as CollectionLink[];
    setDraftLinks(parsed);
    setExpandedDocIds(parsed.map((link) => link.resourceId));
    segmentDraftsRef.current = collectSegmentDrafts(parsed);
  }, [initialLinksSignature]);

  const preloadDocumentIds = useMemo(
    () =>
      Array.from(
        new Set([
          ...draftLinks.map((link) => link.resourceId),
          ...(localElements ? [LOCAL_DOCUMENT_ID] : []),
          ...expandedDocIds,
        ]),
      ),
    [draftLinks, localElements, expandedDocIds],
  );

  const { documents, docCache, isSearching, error, retry } = useLinkSearch({
    open: true,
    term,
    localElements,
    preloadDocumentIds,
  });

  const childIndexes = useMemo(() => {
    const indexes = new Map<string, ChildIndex>();
    Object.entries(docCache).forEach(([docId, document]) => {
      indexes.set(docId, buildChildIndex(document.elements));
    });
    return indexes;
  }, [docCache]);

  const {
    selectedElementIds,
    indeterminateElementIds,
    elementIdsWithSegments,
  } = useMemo(
    () => summarizeSelection(draftLinks, docCache, childIndexes),
    [draftLinks, docCache, childIndexes],
  );

  const selectedGroups = useMemo(
    () => buildSelectedGroups(draftLinks, docCache),
    [draftLinks, docCache],
  );

  const labelledDocuments = useMemo<LinkTreeDocument[]>(
    () =>
      documents.map((document) => {
        if (document.id !== LOCAL_DOCUMENT_ID && !docCache[document.id])
          return document;
        return {
          ...document,
          label: resolveDocumentLabel(docCache[document.id], document.id),
        };
      }),
    [documents, docCache],
  );

  const segmentsFor = useCallback<SegmentsLookup>(
    (elementId) => segmentDraftsRef.current.get(elementId),
    [],
  );

  const applyUpdate = useCallback((update: LinkSelectionUpdate) => {
    update.preservedSegments.forEach(([elementId, segments]) => {
      segmentDraftsRef.current.set(elementId, segments);
    });
    setDraftLinks(update.links);
  }, []);

  const findElement = useCallback(
    (docId: string, elementId: string) => {
      const cached = docCache[docId]?.elements.find(
        (candidate) => candidate.id === elementId,
      );
      if (cached) return cached;
      if (docId !== LOCAL_DOCUMENT_ID) return undefined;
      return localElements?.find((candidate) => candidate.id === elementId);
    },
    [docCache, localElements],
  );

  const handleToggleDoc = useCallback((docId: string) => {
    setExpandedDocIds((previous) =>
      previous.includes(docId)
        ? previous.filter((id) => id !== docId)
        : [...previous, docId],
    );
  }, []);

  const handleToggleElement = useCallback(
    (docId: string, elementId: string) => {
      const index = childIndexes.get(docId);
      const descendants = index ? collectDescendants(index, elementId) : [];
      const currentIds = selectedIdsForDocument(draftLinks, docId);

      applyUpdate(
        rebuildDocumentLinks(
          draftLinks,
          docId,
          nextSelectionForElement(currentIds, elementId, descendants),
          segmentsFor,
        ),
      );
    },
    [applyUpdate, childIndexes, draftLinks, segmentsFor],
  );

  const handleRemoveElement = useCallback(
    (docId: string, elementId: string) => {
      const index = childIndexes.get(docId);
      const removedIds = new Set([
        elementId,
        ...(index ? collectDescendants(index, elementId) : []),
      ]);
      const nextIds = new Set(
        Array.from(selectedIdsForDocument(draftLinks, docId)).filter(
          (id) => !removedIds.has(id),
        ),
      );

      applyUpdate(
        rebuildDocumentLinks(draftLinks, docId, nextIds, segmentsFor),
      );
    },
    [applyUpdate, childIndexes, draftLinks, segmentsFor],
  );

  const handleRemoveDocument = useCallback(
    (docId: string) => {
      applyUpdate(
        rebuildDocumentLinks(draftLinks, docId, new Set<string>(), segmentsFor),
      );
    },
    [applyUpdate, draftLinks, segmentsFor],
  );

  const handleMarkSegments = useCallback(
    (docId: string, elementId: string) => {
      if (!onRequestSegments) return;

      const element = findElement(docId, elementId);
      if (!element) return;

      const baseText = getSegmentBaseText(element);

      onRequestSegments({
        documentId: docId,
        elementId,
        elementLabel: formatDeviceLabel(element) ?? elementId,
        baseText,
        segments: segmentDraftsRef.current.get(elementId) ?? [],
        onResolve: (segments) => {
          const anchored = segments.map((segment) =>
            withSegmentAnchor(baseText, segment),
          );

          if (anchored.length)
            segmentDraftsRef.current.set(elementId, anchored);
          else segmentDraftsRef.current.delete(elementId);

          setDraftLinks((previous) =>
            replaceElementSegments(previous, docId, elementId, anchored),
          );
        },
      });
    },
    [findElement, onRequestSegments],
  );

  const handleConfirm = useCallback(() => {
    onConfirm(draftLinks, docCache);
    onBack();
  }, [docCache, draftLinks, onBack, onConfirm]);

  const trimmedTerm = term.trim();
  const hasQuery = trimmedTerm !== "";
  const hasSelection = draftLinks.length > 0;
  const isEditing = Boolean(initialLinks && initialLinks.length > 0);
  const canConfirm = hasSelection || isEditing;
  const emptyMessage = isSearching
    ? "Buscando…"
    : "Nenhum dispositivo encontrado.";
  const instruction = localElements
    ? "Busque por palavra, expressão ou dispositivo, ou expanda o documento atual abaixo para escolher os vínculos."
    : "Busque por palavra, expressão ou dispositivo para escolher os vínculos.";

  return (
    <InspectorView
      title={title ?? "Vínculos normativos"}
      onBack={onBack}
      onToggleCollapse={onToggleCollapse}
      footer={
        <>
          <span className={cn(ui.hint, "mr-auto truncate")}>
            {formatSelectionSummary(
              selectedElementIds.length,
              draftLinks.length,
            )}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            className={ui.smallButton}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={ui.smallButton}
          >
            Confirmar
          </Button>
        </>
      }
    >
      <InspectorSection>
        <div className="relative">
          <Search className="pointer-events-none absolute left-1.5 top-1.5 h-3 w-3 text-muted-foreground" />
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Buscar dispositivo…"
            aria-label="Buscar dispositivo"
            className={cn(ui.control, "pl-6 pr-6")}
          />
          {isSearching && (
            <Loader2
              className="absolute right-1.5 top-1.5 h-3 w-3 animate-spin text-muted-foreground"
              aria-label="Buscando"
            />
          )}
        </div>
      </InspectorSection>

      {hasSelection && (
        <InspectorSection title="Selecionados">
          <ul className="space-y-1">
            {selectedGroups.map((group) => (
              <li
                key={group.documentId}
                className="rounded-sm border border-border/60"
              >
                <div className="flex h-6 items-center gap-1 border-b border-border/60 px-1">
                  <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <span
                    className="min-w-0 flex-1 truncate text-[11px] font-medium"
                    title={group.documentLabel}
                  >
                    {group.documentLabel}
                  </span>
                  {group.elements.length > 0 && (
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {group.elements.length}
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveDocument(group.documentId)}
                    title={`Remover ${group.documentLabel}`}
                    aria-label={`Remover ${group.documentLabel}`}
                    className="h-4 w-4 shrink-0 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                {group.wholeDocument ? (
                  <p className="px-1 py-1 text-[11px] italic text-muted-foreground">
                    Documento inteiro
                  </p>
                ) : (
                  <ul>
                    {group.elements.map((element) => (
                      <li
                        key={element.elementId}
                        data-selected-element-id={element.elementId}
                        className="flex h-6 items-center gap-1 px-1"
                      >
                        <span className="shrink-0 font-mono text-[10px]">
                          {element.label}
                        </span>
                        {element.segmentCount > 0 && (
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {element.segmentCount === 1
                              ? "1 trecho"
                              : `${element.segmentCount} trechos`}
                          </span>
                        )}
                        <span className="min-w-0 flex-1" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleRemoveElement(
                              group.documentId,
                              element.elementId,
                            )
                          }
                          title={`Remover ${element.label}`}
                          aria-label={`Remover ${element.label}`}
                          className="h-4 w-4 shrink-0 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </InspectorSection>
      )}

      {error && (
        <div
          role="alert"
          className="mx-3 mt-2 flex items-start gap-1.5 rounded-sm border border-destructive/40 px-1.5 py-1 text-[11px] text-destructive"
        >
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
          <span className="min-w-0 flex-1">{error}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={retry}
            className={cn(ui.smallButton, "shrink-0")}
          >
            Tentar novamente
          </Button>
        </div>
      )}

      {!hasQuery && !hasSelection && (
        <InspectorEmpty icon={<Search className="h-4 w-4" />}>
          {instruction}
        </InspectorEmpty>
      )}

      {(hasQuery || labelledDocuments.length > 0) && (
        <div className="px-1.5 pb-2 pt-1">
          <LinkTree
            documents={labelledDocuments}
            expandedDocIds={expandedDocIds}
            onToggleDoc={handleToggleDoc}
            selectionMode="multiple"
            selectedElementIds={selectedElementIds}
            indeterminateElementIds={indeterminateElementIds}
            onToggleElement={handleToggleElement}
            onMarkSegments={onRequestSegments ? handleMarkSegments : undefined}
            elementIdsWithSegments={elementIdsWithSegments}
            highlightTerm={trimmedTerm || undefined}
            density="compact"
            emptyMessage={emptyMessage}
          />
        </div>
      )}
    </InspectorView>
  );
}
