import React, { useCallback, useMemo, useState } from "react";
import { Badge, Button, cn } from "@open-urbis/map-ui";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Filter,
  FileText,
  List,
  Loader2,
  Minus,
  MousePointerClick,
} from "lucide-react";
import { HIGHLIGHT_CLASS } from "@/lib/search-highlight";

export interface LinkTreeElement {
  id: string;
  type: string;
  index?: string;
  text: string;
  parentId?: string;
}

export interface LinkTreeDocument {
  id: string;
  label: string;
  elements: LinkTreeElement[];
  /** Elementos que casaram com a busca (para destaque e filtro). */
  matchedElementIds: string[];
  isLoading?: boolean;
}

export interface LinkTreeProps {
  documents: LinkTreeDocument[];
  expandedDocIds: string[];
  onToggleDoc: (docId: string) => void;
  selectionMode: "single" | "multiple";
  /** elementId[] selecionados. */
  selectedElementIds: string[];
  /** elementId[] em estado parcial (ex.: "só caput" selecionado, filhos não). */
  indeterminateElementIds?: string[];
  onToggleElement: (docId: string, elementId: string) => void;
  /** Quando definido, mostra a ação de marcar trechos no elemento. */
  onMarkSegments?: (docId: string, elementId: string) => void;
  /** elementId[] que já possuem trechos marcados. */
  elementIdsWithSegments?: string[];
  /** Termo para destacar no texto. */
  highlightTerm?: string;
  /** 'compact' = linhas de 24px, para caber no inspetor lateral. */
  density?: "compact" | "default";
  emptyMessage?: string;
}

type Density = "compact" | "default";

interface DensityTokens {
  row: string;
  text: string;
  indent: number;
  control: string;
  icon: string;
  badge: string;
  action: string;
  iconOnlyAction: boolean;
}

const DENSITY_TOKENS: Record<Density, DensityTokens> = {
  compact: {
    row: "h-6 gap-1 px-1",
    text: "text-[11px]",
    indent: 10,
    control: "h-3 w-3",
    icon: "h-3 w-3",
    badge: "h-3.5 px-1 text-[9px]",
    action: "h-4 w-4 p-0",
    iconOnlyAction: true,
  },
  default: {
    row: "min-h-7 gap-1.5 px-1.5 py-0.5",
    text: "text-xs",
    indent: 16,
    control: "h-4 w-4",
    icon: "h-3.5 w-3.5",
    badge: "h-4 px-1 text-[10px]",
    action: "h-5 w-auto gap-1 px-1 text-[10px]",
    iconOnlyAction: false,
  },
};

/* -------------------------------------------------------------------------- */
/* Highlight                                                                   */
/* -------------------------------------------------------------------------- */

interface HighlightPart {
  text: string;
  match: boolean;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const HIGHLIGHT_CACHE_LIMIT = 4000;
const highlightCache = new Map<string, HighlightPart[]>();

/**
 * Splits `text` around `term` occurrences.
 *
 * Deliberately string-based: the previous implementation parsed every node's
 * HTML with `DOMParser` on every render. Results are cached by `(text, term)`
 * because the same element text is re-rendered on each keystroke.
 */
function splitHighlight(text: string, term: string): HighlightPart[] {
  const trimmedTerm = term.trim();
  if (!trimmedTerm || !text) return [{ text, match: false }];

  const cacheKey = `${trimmedTerm}\u0000${text}`;
  const cached = highlightCache.get(cacheKey);
  if (cached) return cached;

  const lowerTerm = trimmedTerm.toLowerCase();
  const parts = text
    .split(new RegExp(`(${escapeRegExp(trimmedTerm)})`, "gi"))
    .filter((part) => part !== "")
    .map((part) => ({ text: part, match: part.toLowerCase() === lowerTerm }));

  if (highlightCache.size >= HIGHLIGHT_CACHE_LIMIT) highlightCache.clear();
  highlightCache.set(cacheKey, parts);

  return parts;
}

const HighlightedText = React.memo(function HighlightedText({
  text,
  term,
}: {
  text: string;
  term?: string;
}) {
  const parts = useMemo(() => splitHighlight(text, term ?? ""), [text, term]);

  return (
    <>
      {parts.map((part, partIndex) =>
        part.match ? (
          <mark key={`${partIndex}-${part.text}`} className={HIGHLIGHT_CLASS}>
            {part.text}
          </mark>
        ) : (
          <React.Fragment key={`${partIndex}-${part.text}`}>
            {part.text}
          </React.Fragment>
        ),
      )}
    </>
  );
});

/* -------------------------------------------------------------------------- */
/* Index                                                                       */
/* -------------------------------------------------------------------------- */

interface LinkTreeIndex {
  byId: Map<string, LinkTreeElement>;
  childrenByParent: Map<string, LinkTreeElement[]>;
  roots: LinkTreeElement[];
}

function buildTreeIndex(elements: LinkTreeElement[]): LinkTreeIndex {
  const byId = new Map<string, LinkTreeElement>();
  elements.forEach((element) => byId.set(element.id, element));

  const childrenByParent = new Map<string, LinkTreeElement[]>();
  const roots: LinkTreeElement[] = [];

  elements.forEach((element) => {
    const parentId = element.parentId;
    if (!parentId || !byId.has(parentId)) {
      roots.push(element);
      return;
    }

    const siblings = childrenByParent.get(parentId);
    if (siblings) siblings.push(element);
    else childrenByParent.set(parentId, [element]);
  });

  return { byId, childrenByParent, roots };
}

/**
 * Matches plus their siblings and their linear ancestors — uncles stay hidden.
 * `null` means "no filter" (show the whole doc).
 */
function computeVisibleIds(
  index: LinkTreeIndex,
  matchedElementIds: string[],
): Set<string> | null {
  if (!matchedElementIds.length) return null;

  const ids = new Set<string>();

  matchedElementIds.forEach((matchId) => {
    const match = index.byId.get(matchId);
    if (!match) return;

    ids.add(match.id);

    const siblings =
      match.parentId && index.byId.has(match.parentId)
        ? (index.childrenByParent.get(match.parentId) ?? [])
        : index.roots;
    siblings.forEach((sibling) => ids.add(sibling.id));

    const seen = new Set<string>();
    let cursor = match.parentId ? index.byId.get(match.parentId) : undefined;
    while (cursor && !seen.has(cursor.id)) {
      seen.add(cursor.id);
      ids.add(cursor.id);
      cursor = cursor.parentId ? index.byId.get(cursor.parentId) : undefined;
    }
  });

  return ids;
}

function toSet(values?: string[]): Set<string> {
  return new Set(values ?? []);
}

function isToggleKey(key: string): boolean {
  return key === "Enter" || key === " " || key === "Spacebar";
}

/* -------------------------------------------------------------------------- */
/* Element node                                                                */
/* -------------------------------------------------------------------------- */

interface LinkTreeElementNodeProps {
  element: LinkTreeElement;
  docId: string;
  level: number;
  index: LinkTreeIndex;
  visibleIds: Set<string> | null;
  collapsedIds: Set<string>;
  onToggleExpand: (elementId: string) => void;
  selectionMode: "single" | "multiple";
  selectedIds: Set<string>;
  indeterminateIds: Set<string>;
  segmentIds: Set<string>;
  matchedIds: Set<string>;
  onToggleElement: (docId: string, elementId: string) => void;
  onMarkSegments?: (docId: string, elementId: string) => void;
  highlightTerm?: string;
  tokens: DensityTokens;
}

const LinkTreeElementNode = React.memo(function LinkTreeElementNode({
  element,
  docId,
  level,
  index,
  visibleIds,
  collapsedIds,
  onToggleExpand,
  selectionMode,
  selectedIds,
  indeterminateIds,
  segmentIds,
  matchedIds,
  onToggleElement,
  onMarkSegments,
  highlightTerm,
  tokens,
}: LinkTreeElementNodeProps) {
  const allChildren = index.childrenByParent.get(element.id);
  const children = useMemo(() => {
    if (!allChildren) return [];
    if (!visibleIds) return allChildren;
    return allChildren.filter((child) => visibleIds.has(child.id));
  }, [allChildren, visibleIds]);

  const hasChildren = children.length > 0;
  const isExpanded = hasChildren && !collapsedIds.has(element.id);
  const isSelected = selectedIds.has(element.id);
  // Um elemento parcial (apenas o caput) está selecionado E parcial: o traço
  // tem prioridade visual sobre o check.
  const isIndeterminate = indeterminateIds.has(element.id);
  const isMatched = matchedIds.has(element.id);
  const hasSegments = segmentIds.has(element.id);

  const handleToggleSelection = useCallback(() => {
    onToggleElement(docId, element.id);
  }, [docId, element.id, onToggleElement]);

  const handleToggleExpand = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onToggleExpand(element.id);
    },
    [element.id, onToggleExpand],
  );

  const handleMarkSegments = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onMarkSegments?.(docId, element.id);
    },
    [docId, element.id, onMarkSegments],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (isToggleKey(event.key)) {
        event.preventDefault();
        event.stopPropagation();
        onToggleElement(docId, element.id);
        return;
      }

      if (event.key === "ArrowRight" && hasChildren && !isExpanded) {
        event.preventDefault();
        event.stopPropagation();
        onToggleExpand(element.id);
        return;
      }

      if (event.key === "ArrowLeft" && isExpanded) {
        event.preventDefault();
        event.stopPropagation();
        onToggleExpand(element.id);
      }
    },
    [
      docId,
      element.id,
      hasChildren,
      isExpanded,
      onToggleElement,
      onToggleExpand,
    ],
  );

  const label = element.index
    ? `${element.type} ${element.index}`
    : element.type;

  return (
    <div
      role="treeitem"
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-selected={isSelected}
      aria-checked={isIndeterminate ? "mixed" : isSelected}
      aria-level={level + 1}
      data-element-id={element.id}
      data-selection-state={
        isIndeterminate ? "partial" : isSelected ? "selected" : "none"
      }
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="group/node outline-none"
    >
      <div
        onClick={handleToggleSelection}
        style={{ paddingLeft: level * tokens.indent }}
        className={cn(
          "group/row flex cursor-pointer items-center border-l-2 border-transparent hover:bg-muted/40",
          "group-focus-visible/node:ring-1 group-focus-visible/node:ring-ring",
          tokens.row,
          tokens.text,
          isSelected && "border-foreground font-medium text-foreground",
        )}
      >
        {hasChildren ? (
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={handleToggleExpand}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? (
              <ChevronDown className={tokens.icon} />
            ) : (
              <ChevronRight className={tokens.icon} />
            )}
          </button>
        ) : (
          <span className={cn("shrink-0", tokens.icon)} />
        )}

        <SelectionControl
          selectionMode={selectionMode}
          isSelected={isSelected}
          isIndeterminate={isIndeterminate}
          sizeClassName={tokens.control}
        />

        <Badge
          variant="outline"
          className={cn(
            "shrink-0 whitespace-nowrap font-mono font-normal",
            tokens.badge,
          )}
        >
          {label}
        </Badge>

        <span
          className={cn(
            "min-w-0 flex-1 truncate text-muted-foreground",
            isMatched && "text-foreground",
          )}
        >
          <HighlightedText text={element.text} term={highlightTerm} />
        </span>

        {onMarkSegments && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            tabIndex={-1}
            onClick={handleMarkSegments}
            title={hasSegments ? "Trechos marcados" : "Marcar trechos"}
            className={cn(
              "shrink-0 text-muted-foreground hover:text-foreground",
              tokens.action,
              hasSegments
                ? "text-foreground"
                : "opacity-0 focus-visible:opacity-100 group-hover/row:opacity-100",
            )}
          >
            <MousePointerClick className={tokens.icon} />
            {!tokens.iconOnlyAction && (
              <span>{hasSegments ? "Trechos" : "Trecho"}</span>
            )}
          </Button>
        )}
      </div>

      {isExpanded && (
        <div role="group">
          {children.map((child) => (
            <LinkTreeElementNode
              key={child.id}
              element={child}
              docId={docId}
              level={level + 1}
              index={index}
              visibleIds={visibleIds}
              collapsedIds={collapsedIds}
              onToggleExpand={onToggleExpand}
              selectionMode={selectionMode}
              selectedIds={selectedIds}
              indeterminateIds={indeterminateIds}
              segmentIds={segmentIds}
              matchedIds={matchedIds}
              onToggleElement={onToggleElement}
              onMarkSegments={onMarkSegments}
              highlightTerm={highlightTerm}
              tokens={tokens}
            />
          ))}
        </div>
      )}
    </div>
  );
});

interface SelectionControlProps {
  selectionMode: "single" | "multiple";
  isSelected: boolean;
  isIndeterminate: boolean;
  sizeClassName: string;
}

/**
 * Tri-state control.
 *
 * Deliberadamente não usa o `Checkbox` do `map-ui`: ele é um Radix Root, e
 * arrastar o Radix para dentro da árvore quebra o render no servidor (duas
 * cópias de React na resolução do pnpm). O estado é publicado em
 * `data-state` e o `aria-checked` (incl. `mixed`) fica no `treeitem` da linha,
 * que é o elemento realmente selecionável.
 *
 * O estado marcado é mostrado pela borda e pelo ícone, sem preenchimento sólido.
 */
function SelectionControl({
  selectionMode,
  isSelected,
  isIndeterminate,
  sizeClassName,
}: SelectionControlProps) {
  if (selectionMode === "single") {
    return isSelected ? (
      <CheckCircle2
        className={cn("shrink-0 text-foreground", sizeClassName)}
        aria-hidden="true"
      />
    ) : (
      <Circle
        className={cn("shrink-0 text-muted-foreground", sizeClassName)}
        aria-hidden="true"
      />
    );
  }

  const state = isIndeterminate
    ? "indeterminate"
    : isSelected
      ? "checked"
      : "unchecked";

  return (
    <span
      aria-hidden="true"
      data-state={state}
      className={cn(
        "grid shrink-0 place-content-center rounded-sm border border-muted-foreground/60 text-foreground",
        "data-[state=checked]:border-foreground",
        "data-[state=indeterminate]:border-foreground",
        sizeClassName,
      )}
    >
      {isIndeterminate && <Minus className={sizeClassName} strokeWidth={3} />}
      {!isIndeterminate && isSelected && (
        <Check className={sizeClassName} strokeWidth={3} />
      )}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Document node                                                               */
/* -------------------------------------------------------------------------- */

interface LinkTreeDocumentNodeProps {
  doc: LinkTreeDocument;
  isExpanded: boolean;
  onToggleDoc: (docId: string) => void;
  selectionMode: "single" | "multiple";
  selectedIds: Set<string>;
  indeterminateIds: Set<string>;
  segmentIds: Set<string>;
  onToggleElement: (docId: string, elementId: string) => void;
  onMarkSegments?: (docId: string, elementId: string) => void;
  highlightTerm?: string;
  tokens: DensityTokens;
  density: Density;
}

const LinkTreeDocumentNode = React.memo(function LinkTreeDocumentNode({
  doc,
  isExpanded,
  onToggleDoc,
  selectionMode,
  selectedIds,
  indeterminateIds,
  segmentIds,
  onToggleElement,
  onMarkSegments,
  highlightTerm,
  tokens,
  density,
}: LinkTreeDocumentNodeProps) {
  const [showAll, setShowAll] = useState(false);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(
    () => new Set(),
  );

  const index = useMemo(() => buildTreeIndex(doc.elements), [doc.elements]);
  const matchedIds = useMemo(
    () => toSet(doc.matchedElementIds),
    [doc.matchedElementIds],
  );

  const visibleIds = useMemo(
    () => (showAll ? null : computeVisibleIds(index, doc.matchedElementIds)),
    [index, doc.matchedElementIds, showAll],
  );

  const roots = useMemo(
    () =>
      visibleIds
        ? index.roots.filter((root) => visibleIds.has(root.id))
        : index.roots,
    [index, visibleIds],
  );

  const selectedCount = useMemo(
    () =>
      doc.elements.reduce(
        (total, element) => (selectedIds.has(element.id) ? total + 1 : total),
        0,
      ),
    [doc.elements, selectedIds],
  );

  const handleToggleExpand = useCallback((elementId: string) => {
    setCollapsedIds((previous) => {
      const next = new Set(previous);
      if (next.has(elementId)) next.delete(elementId);
      else next.add(elementId);
      return next;
    });
  }, []);

  const handleToggleDoc = useCallback(
    () => onToggleDoc(doc.id),
    [doc.id, onToggleDoc],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (isToggleKey(event.key)) {
        event.preventDefault();
        event.stopPropagation();
        onToggleDoc(doc.id);
        return;
      }

      if (
        (event.key === "ArrowRight" && !isExpanded) ||
        (event.key === "ArrowLeft" && isExpanded)
      ) {
        event.preventDefault();
        event.stopPropagation();
        onToggleDoc(doc.id);
      }
    },
    [doc.id, isExpanded, onToggleDoc],
  );

  const handleToggleShowAll = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setShowAll((previous) => !previous);
  }, []);

  const isCompact = density === "compact";

  return (
    <div
      role="treeitem"
      aria-expanded={isExpanded}
      aria-selected={false}
      aria-level={1}
      data-doc-id={doc.id}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="group/doc border-b border-border/60 outline-none"
    >
      <div
        onClick={handleToggleDoc}
        className={cn(
          "flex cursor-pointer items-center hover:bg-muted/40",
          "group-focus-visible/doc:ring-1 group-focus-visible/doc:ring-ring",
          isCompact ? "h-6 gap-1 px-1" : "min-h-8 gap-1.5 px-2 py-1",
          tokens.text,
        )}
      >
        {doc.isLoading ? (
          <Loader2
            className={cn(
              "shrink-0 animate-spin text-muted-foreground",
              tokens.icon,
            )}
          />
        ) : isExpanded ? (
          <ChevronDown
            className={cn("shrink-0 text-muted-foreground", tokens.icon)}
          />
        ) : (
          <ChevronRight
            className={cn("shrink-0 text-muted-foreground", tokens.icon)}
          />
        )}

        <FileText
          className={cn("shrink-0 text-muted-foreground", tokens.icon)}
        />

        <span className="min-w-0 flex-1 truncate font-medium">{doc.label}</span>

        {doc.matchedElementIds.length > 0 && (
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 font-normal text-muted-foreground",
              tokens.badge,
            )}
          >
            {doc.matchedElementIds.length}
          </Badge>
        )}

        {selectedCount > 0 && (
          <Badge
            variant="outline"
            className={cn("shrink-0 font-normal", tokens.badge)}
          >
            {selectedCount}
          </Badge>
        )}

        {doc.matchedElementIds.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            tabIndex={-1}
            onClick={handleToggleShowAll}
            title={showAll ? "Filtrar resultados" : "Ver todo o documento"}
            className={cn(
              "shrink-0 text-muted-foreground hover:text-foreground",
              tokens.action,
            )}
          >
            {showAll ? (
              <Filter className={tokens.icon} />
            ) : (
              <List className={tokens.icon} />
            )}
          </Button>
        )}
      </div>

      {isExpanded && (
        <div role="group" className="border-t border-border/60 py-0.5">
          {roots.length > 0 ? (
            roots.map((root) => (
              <LinkTreeElementNode
                key={root.id}
                element={root}
                docId={doc.id}
                level={0}
                index={index}
                visibleIds={visibleIds}
                collapsedIds={collapsedIds}
                onToggleExpand={handleToggleExpand}
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                indeterminateIds={indeterminateIds}
                segmentIds={segmentIds}
                matchedIds={matchedIds}
                onToggleElement={onToggleElement}
                onMarkSegments={onMarkSegments}
                highlightTerm={highlightTerm}
                tokens={tokens}
              />
            ))
          ) : (
            <p
              className={cn(
                "px-2 py-1 italic text-muted-foreground",
                tokens.text,
              )}
            >
              {doc.isLoading
                ? "Carregando estrutura…"
                : "Estrutura não disponível."}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/* Tree                                                                        */
/* -------------------------------------------------------------------------- */

export const LinkTree = React.memo(function LinkTree({
  documents,
  expandedDocIds,
  onToggleDoc,
  selectionMode,
  selectedElementIds,
  indeterminateElementIds,
  onToggleElement,
  onMarkSegments,
  elementIdsWithSegments,
  highlightTerm,
  density = "default",
  emptyMessage = "Nenhum resultado.",
}: LinkTreeProps) {
  const tokens = DENSITY_TOKENS[density];
  const expandedSet = useMemo(() => toSet(expandedDocIds), [expandedDocIds]);
  const selectedIds = useMemo(
    () => toSet(selectedElementIds),
    [selectedElementIds],
  );
  const indeterminateIds = useMemo(
    () => toSet(indeterminateElementIds),
    [indeterminateElementIds],
  );
  const segmentIds = useMemo(
    () => toSet(elementIdsWithSegments),
    [elementIdsWithSegments],
  );

  if (!documents.length) {
    return (
      <p
        className={cn(
          "px-2 py-4 text-center italic text-muted-foreground",
          tokens.text,
        )}
      >
        {emptyMessage}
      </p>
    );
  }

  return (
    <div
      role="tree"
      aria-multiselectable={selectionMode === "multiple"}
      className="w-full"
    >
      {documents.map((doc) => (
        <LinkTreeDocumentNode
          key={doc.id}
          doc={doc}
          isExpanded={expandedSet.has(doc.id)}
          onToggleDoc={onToggleDoc}
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          indeterminateIds={indeterminateIds}
          segmentIds={segmentIds}
          onToggleElement={onToggleElement}
          onMarkSegments={onMarkSegments}
          highlightTerm={highlightTerm}
          tokens={tokens}
          density={density}
        />
      ))}
    </div>
  );
});
