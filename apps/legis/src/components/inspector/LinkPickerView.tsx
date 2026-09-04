import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from "@open-urbis/map-ui";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  List,
  Loader2,
  Search,
  X,
} from "lucide-react";
import type {
  NormativeElementEntity,
  OriginalNormativo,
} from "../../domain/entities";
import { getElementKey } from "../../domain/display-logic";
import {
  formatNormativeDate,
  getNormativeDesignation,
} from "../../domain/normative-labels";
import { getSegmentBaseText } from "../../domain/segment-anchor";
import { htmlToPlainText } from "../../domain/text-utils";
import { NORMATIVE_TYPES } from "../../data/normative-types";
import type { SearchCondition } from "../../services/page-service";
import { HIGHLIGHT_CLASS } from "@/lib/search-highlight";
import {
  LinkTree,
  type LinkTreeDocument,
  type LinkTreeElement,
} from "../collection/link-tree";
import {
  LOCAL_DOCUMENT_ID,
  useLinkSearch,
} from "../collection/use-link-search";
import {
  InspectorEmpty,
  InspectorField,
  InspectorSection,
  InspectorView,
} from "./InspectorShell";
import { ui } from "./inspector-tokens";

export interface LinkPickerSelection {
  /** Documento de origem. */
  documentId: string;
  /** Rótulo legível do documento, já resolvido. */
  documentLabel: string;
  /** Elemento escolhido. */
  elementId: string;
  /** Referência legível do dispositivo, ex. "Art. 3º". Pode ser undefined. */
  deviceLabel?: string;
  /** Documento completo, para o chamador cachear. */
  document?: OriginalNormativo;
}

export interface LinkPickerViewProps {
  /** Título da view, ex. "Vincular dispositivo". */
  title?: string;
  /** Elementos do documento atual, para permitir vínculo interno. */
  localElements?: NormativeElementEntity[];
  /** Vínculo já escolhido, para pré-selecionar e pré-carregar o documento. */
  initialSelection?: { documentId?: string; elementId?: string };
  onSelect: (selection: LinkPickerSelection) => void;
  onBack: () => void;
  onToggleCollapse?: () => void;
}

export const LOCAL_DOCUMENT_LABEL = "Este documento";

const ANY_NORMATIVE_TYPE = "all";

/** Caracteres do trecho mostrado em cada resultado. */
export const SNIPPET_LENGTH = 120;

/**
 * Quantos documentos da busca têm a estrutura carregada para render dos trechos.
 *
 * Sem isto os resultados só teriam o id do elemento: o texto de cada dispositivo
 * vive em `docCache[docId].elements`, que só é preenchido para os documentos
 * pedidos via `preloadDocumentIds`. O limite existe para não disparar uma
 * requisição por documento numa busca ampla.
 */
const RESULT_PRELOAD_LIMIT = 12;

const NORMATIVE_TYPE_OPTIONS = Object.entries(NORMATIVE_TYPES)
  .map(([value, label]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));

/* -------------------------------------------------------------------------- */
/* Labels                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Mesma regra do rótulo usado pelo painel de situações especiais, copiada para
 * manter esta view independente do gerenciador em modal. A designação segue o
 * padrão do Legis ("Decreto nº 57.776/2017") em vez do código interno do tipo.
 */
export function resolveDocumentLabel(
  document: OriginalNormativo | undefined,
  documentId: string,
): string {
  if (documentId === LOCAL_DOCUMENT_ID) return LOCAL_DOCUMENT_LABEL;
  if (!document) return `Doc ${documentId}`;

  const descriptor =
    document.name?.trim() ||
    (document as any).title?.trim() ||
    document.ementa?.trim() ||
    "";
  const designation = document.number ? getNormativeDesignation(document) : "";
  const baseLabel =
    designation ||
    (descriptor
      ? `${descriptor.substring(0, 40)}${descriptor.length > 40 ? "..." : ""}`
      : `Doc ${documentId}`);

  // A designação já traz o ano ("nº 536/2023"); repetir a data só gastaria linha.
  const hasYear = /\/\d{4}$/.test(baseLabel);
  if (!document.actDate || hasYear) return baseLabel;

  return `${baseLabel} · ${formatNormativeDate(document.actDate)}`;
}

export function formatDeviceLabel(
  element?: { type?: string; index?: string } | null,
): string | undefined {
  if (!element) return undefined;

  const label = [element.type, element.index].filter(Boolean).join(" ").trim();
  return label || undefined;
}

/** Chave crua do documento, sem a pontuação de ligação ("Art. 37 ", "I - "). */
function rawDeviceKey(element: {
  type?: string;
  index?: string;
  text?: string;
}): string {
  return getElementKey(element as NormativeElementEntity)
    .replace(/[\s\-–—.]+$/, "")
    .trim();
}

/** Chave do dispositivo como o documento a exibe: "Art. 37", "§ 1º", "I". */
export function formatDeviceKey(
  element?: { type?: string; index?: string; text?: string } | null,
): string | undefined {
  if (!element) return undefined;

  return rawDeviceKey(element) || formatDeviceLabel(element);
}

/** Tipos que se explicam sozinhos numa lista, sem precisar do dispositivo-pai. */
const SELF_SUFFICIENT_TYPES = new Set([
  "Parte",
  "Livro",
  "Título",
  "Capítulo",
  "Seção",
  "Subseção",
  "Artigo",
  "Tabela",
  "Figura",
  "Mapa",
  "Anexo",
]);

/**
 * Dispositivos como Texto, parágrafo, inciso e alínea ficam órfãos numa lista de
 * resultados — "I" ou "Texto" sozinhos não dizem o que se está vinculando. Aqui
 * subimos a estrutura até o dispositivo mais próximo que tem chave, como o
 * documento faz ao exibir o contexto.
 */
export function resolveDeviceContext(
  element: LinkTreeElement | undefined,
  byId: Map<string, LinkTreeElement>,
): string | undefined {
  if (!element?.parentId) return undefined;
  if (SELF_SUFFICIENT_TYPES.has(element.type ?? "")) return undefined;

  let current = byId.get(element.parentId);

  for (let guard = 0; current && guard < 20; guard += 1) {
    const key = rawDeviceKey(current);

    if (key) return key;
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  return undefined;
}

/** "12 resultados em 3 documentos", com singular correto. */
export function formatResultSummary(
  resultCount: number,
  documentCount: number,
): string {
  if (resultCount <= 0) return "Nenhum resultado";

  const results =
    resultCount === 1 ? "1 resultado" : `${resultCount} resultados`;
  const documents =
    documentCount === 1 ? "1 documento" : `${documentCount} documentos`;

  return `${results} em ${documents}`;
}

/* -------------------------------------------------------------------------- */
/* Snippet                                                                     */
/* -------------------------------------------------------------------------- */

export interface SnippetParts {
  /** Texto antes da ocorrência, já com elipse inicial quando recortado. */
  before: string;
  /** Ocorrência do termo, preservando o caixa original. Ausente se não casou. */
  match?: string;
  /** Texto após a ocorrência, já com elipse final quando recortado. */
  after: string;
}

/** Marcação fora, espaços colapsados: o recorte trabalha só com texto. */
function toPlainSnippetText(text: string): string {
  if (!text) return "";
  return htmlToPlainText(text).replace(/\s+/g, " ").trim();
}

/** Corta o começo do texto numa fronteira de palavra, quando dá. */
function clampHead(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  const space = text.lastIndexOf(" ", maxLength);
  const cut = space >= Math.floor(maxLength / 2) ? space : maxLength;

  return `${text.slice(0, cut)}…`;
}

/**
 * Recorta ~`maxLength` caracteres em volta da primeira ocorrência de `term`.
 *
 * Puro e independente de HTML: a marcação do elemento é removida por regex e o
 * resultado sai em três pedaços de texto, que o React escapa ao renderizar. Sem
 * termo (ou sem ocorrência) devolve o início do texto, sem `match`.
 */
export function buildSnippet(
  text: string,
  term: string,
  maxLength: number = SNIPPET_LENGTH,
): SnippetParts {
  const plain = toPlainSnippetText(text);
  if (!plain) return { before: "", after: "" };

  const needle = term?.trim() ?? "";
  const matchIndex = needle
    ? plain.toLowerCase().indexOf(needle.toLowerCase())
    : -1;

  if (matchIndex === -1)
    return { before: clampHead(plain, maxLength), after: "" };

  const match = plain.slice(matchIndex, matchIndex + needle.length);
  const matchEnd = matchIndex + match.length;
  const budget = Math.max(0, maxLength - match.length);

  // Metade do orçamento para cada lado; o que sobrar de um lado (porque o
  // texto acabou) é devolvido ao outro.
  let start = Math.max(0, matchIndex - Math.ceil(budget / 2));
  let end = Math.min(plain.length, matchEnd + (budget - (matchIndex - start)));
  start = Math.max(0, matchIndex - (budget - (end - matchEnd)));

  if (start > 0) {
    const space = plain.indexOf(" ", start);
    if (space !== -1 && space < matchIndex) start = space + 1;
  }

  if (end < plain.length) {
    const space = plain.lastIndexOf(" ", end);
    if (space > matchEnd) end = space;
  }

  return {
    before: `${start > 0 ? "…" : ""}${plain.slice(start, matchIndex)}`,
    match,
    after: `${plain.slice(matchEnd, end)}${end < plain.length ? "…" : ""}`,
  };
}

/* -------------------------------------------------------------------------- */
/* Grouping                                                                    */
/* -------------------------------------------------------------------------- */

export interface LinkResultRow {
  documentId: string;
  elementId: string;
  /** Ex. "Art. 3º". Ausente enquanto a estrutura do documento não chegou. */
  deviceLabel?: string;
  /** Dispositivo que contém o resultado, quando ele não tem chave própria. */
  contextLabel?: string;
  /** Texto canônico do dispositivo, quando já conhecido. */
  text?: string;
}

export interface LinkResultGroup {
  documentId: string;
  /** Rótulo de exibição do documento. */
  documentLabel: string;
  results: LinkResultRow[];
  /** Estrutura ainda não disponível: as linhas mostram placeholder. */
  isLoading: boolean;
}

/**
 * Achata `matchedElementIds` em linhas de resultado, agrupadas por documento.
 *
 * O documento atual vem primeiro; os demais mantêm a ordem entregue pela busca
 * (relevância). Dentro do grupo, as linhas seguem a ordem do documento quando a
 * estrutura já está carregada.
 */
export function groupResultsByDocument(
  documents: LinkTreeDocument[],
  docCache: Record<string, OriginalNormativo> = {},
): LinkResultGroup[] {
  const groups = documents
    .filter((document) => document.matchedElementIds.length > 0)
    .map<LinkResultGroup>((document) => {
      const byId = new Map(
        document.elements.map((element) => [element.id, element]),
      );
      const position = new Map(
        document.elements.map((element, index) => [element.id, index]),
      );
      const cached = docCache[document.id];

      const results = Array.from(new Set(document.matchedElementIds))
        .map<LinkResultRow>((elementId) => {
          const element = byId.get(elementId);

          return {
            documentId: document.id,
            elementId,
            deviceLabel: formatDeviceKey(element),
            contextLabel: resolveDeviceContext(element, byId),
            text: element?.text,
          };
        })
        .sort(
          (a, b) =>
            (position.get(a.elementId) ?? Number.MAX_SAFE_INTEGER) -
            (position.get(b.elementId) ?? Number.MAX_SAFE_INTEGER),
        );

      return {
        documentId: document.id,
        // Sem documento em cache o rótulo da busca (título da página) é
        // mais informativo do que "Doc <id>".
        documentLabel:
          document.id === LOCAL_DOCUMENT_ID || cached
            ? resolveDocumentLabel(cached, document.id)
            : document.label,
        results,
        isLoading: Boolean(document.isLoading) || !document.elements.length,
      };
    });

  return groups.sort(
    (a, b) =>
      Number(b.documentId === LOCAL_DOCUMENT_ID) -
      Number(a.documentId === LOCAL_DOCUMENT_ID),
  );
}

export function countResults(groups: LinkResultGroup[]): number {
  return groups.reduce((total, group) => total + group.results.length, 0);
}

/* -------------------------------------------------------------------------- */
/* Result list                                                                 */
/* -------------------------------------------------------------------------- */

function SnippetText({ text, term }: { text: string; term: string }) {
  const snippet = useMemo(() => buildSnippet(text, term), [text, term]);

  return (
    <>
      {snippet.before}
      {snippet.match && (
        <mark className={HIGHLIGHT_CLASS}>{snippet.match}</mark>
      )}
      {snippet.after}
    </>
  );
}

export interface LinkResultListProps {
  groups: LinkResultGroup[];
  /** Termo destacado nos trechos. */
  term?: string;
  selectedElementId?: string;
  onSelect: (documentId: string, elementId: string) => void;
  /** Abre o documento no modo navegação. */
  onBrowse: (documentId: string) => void;
}

/**
 * Lista achatada de resultados: cada linha é o dispositivo + o trecho que casou,
 * e clicar vincula direto. Exportada para render sem rede.
 */
export function LinkResultList({
  groups,
  term = "",
  selectedElementId,
  onSelect,
  onBrowse,
}: LinkResultListProps) {
  const rowRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Índice global por linha, para as setas percorrerem os grupos em sequência.
  const indexedGroups = useMemo(() => {
    let cursor = 0;

    return groups.map((group) => ({
      ...group,
      results: group.results.map((result) => ({
        ...result,
        rowIndex: cursor++,
      })),
    }));
  }, [groups]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;

      const rows = rowRefs.current.filter((row): row is HTMLButtonElement =>
        Boolean(row),
      );
      if (!rows.length) return;

      event.preventDefault();

      const active = event.currentTarget.ownerDocument.activeElement;
      const current = rows.findIndex((row) => row === active);

      const next = (() => {
        if (event.key === "Home") return 0;
        if (event.key === "End") return rows.length - 1;
        if (event.key === "ArrowDown")
          return current < 0 ? 0 : (current + 1) % rows.length;
        return current <= 0 ? rows.length - 1 : current - 1;
      })();

      rows[next]?.focus();
    },
    [],
  );

  return (
    <div onKeyDown={handleKeyDown} className="pb-2">
      {indexedGroups.map((group) => (
        <div
          key={group.documentId}
          role="group"
          aria-label={group.documentLabel}
        >
          <div
            data-doc-id={group.documentId}
            className="sticky top-0 z-10 flex items-center gap-1 border-b bg-background px-2 py-0.5"
          >
            <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
            <span
              className="min-w-0 flex-1 truncate text-[10px] font-medium text-muted-foreground"
              title={group.documentLabel}
            >
              {group.documentLabel}
            </span>
            <span
              className="shrink-0 text-[10px] text-muted-foreground"
              title={`${group.results.length} dispositivo(s) com ocorrência`}
            >
              {group.results.length}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onBrowse(group.documentId)}
              className={cn(
                ui.smallButton,
                "shrink-0 text-[10px] text-muted-foreground",
              )}
            >
              <List className="h-3 w-3" />
              ver na estrutura
            </Button>
          </div>

          {group.results.map((result) => {
            const isSelected =
              Boolean(selectedElementId) &&
              result.elementId === selectedElementId;
            const label = result.deviceLabel ?? "Dispositivo";
            const prefix = [result.contextLabel, label]
              .filter(Boolean)
              .join(" · ");

            return (
              <button
                key={`${group.documentId}-${result.elementId}`}
                ref={(node) => {
                  rowRefs.current[result.rowIndex] = node;
                }}
                type="button"
                data-doc-id={group.documentId}
                data-element-id={result.elementId}
                aria-current={isSelected ? "true" : undefined}
                title={`Vincular ${prefix} · ${group.documentLabel}`}
                className={cn(
                  "flex w-full items-start gap-1.5 border-b border-border/40 px-3 py-1 text-left",
                  // Reserved left edge: selection paints it without shifting the row.
                  "border-l-2 border-l-transparent",
                  "transition-colors hover:bg-muted/40 focus:bg-muted/40 focus:outline-none",
                  "focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring",
                  isSelected &&
                    "border-l-foreground font-medium text-foreground",
                )}
                onClick={() => onSelect(group.documentId, result.elementId)}
              >
                {/*
                 * Chave e trecho na mesma linha, como o documento os mostra:
                 * metade da altura da linha anterior e sem rótulo solto.
                 */}
                <span className="line-clamp-2 min-w-0 flex-1 text-[11px] leading-snug text-muted-foreground">
                  <span className="font-medium text-foreground">{prefix}</span>
                  {result.text ? (
                    <>
                      {" "}
                      <SnippetText text={result.text} term={term} />
                    </>
                  ) : (
                    <span className="italic"> Carregando texto…</span>
                  )}
                </span>
                {isSelected && (
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* View                                                                        */
/* -------------------------------------------------------------------------- */

/** Documento sintético para o modo navegação, quando a busca não o listou. */
function toBrowseDocument(
  docId: string,
  document: OriginalNormativo | undefined,
  label: string,
): LinkTreeDocument {
  return {
    id: docId,
    label,
    elements: (document?.elements ?? []).map((element) => ({
      id: element.id,
      type: element.type,
      index: element.index,
      text: getSegmentBaseText(element),
      parentId: element.parentId,
    })),
    matchedElementIds: [],
    isLoading: !document,
  };
}

/** Escolha de um único dispositivo, como passo do inspetor lateral. */
export function LinkPickerView({
  title,
  localElements,
  initialSelection,
  onSelect,
  onBack,
  onToggleCollapse,
}: LinkPickerViewProps) {
  const [term, setTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [normativeType, setNormativeType] = useState("");
  const [actDate, setActDate] = useState("");
  const [selectedElementId, setSelectedElementId] = useState(
    initialSelection?.elementId ?? "",
  );
  // Documento aberto no modo navegação. O vínculo já escolhido abre em
  // navegação para o usuário ver a escolha atual em contexto.
  const [browseDocId, setBrowseDocId] = useState<string | null>(
    initialSelection?.documentId ?? null,
  );
  const [expandedDocIds, setExpandedDocIds] = useState<string[]>(() =>
    initialSelection?.documentId ? [initialSelection.documentId] : [],
  );

  const conditions = useMemo<SearchCondition[]>(() => {
    const active: SearchCondition[] = [];

    if (normativeType) {
      active.push({
        id: "filter-normative-type",
        field: "normativeType",
        operator: "equals",
        value: normativeType,
        connector: "AND",
      });
    }

    if (actDate.trim()) {
      active.push({
        id: "filter-act-date",
        field: "actDate",
        operator: "contains",
        value: actDate.trim(),
        connector: "AND",
      });
    }

    return active;
  }, [normativeType, actDate]);

  const [resultDocIds, setResultDocIds] = useState<string[]>([]);

  const preloadDocumentIds = useMemo(
    () =>
      Array.from(
        new Set([
          ...(initialSelection?.documentId
            ? [initialSelection.documentId]
            : []),
          ...(localElements ? [LOCAL_DOCUMENT_ID] : []),
          ...(browseDocId ? [browseDocId] : []),
          ...expandedDocIds,
          ...resultDocIds,
        ]),
      ),
    [
      initialSelection?.documentId,
      localElements,
      browseDocId,
      expandedDocIds,
      resultDocIds,
    ],
  );

  const { documents, docCache, isSearching, error, retry } = useLinkSearch({
    open: true,
    term,
    conditions,
    localElements,
    preloadDocumentIds,
  });

  const groups = useMemo(
    () => groupResultsByDocument(documents, docCache),
    [documents, docCache],
  );

  // Os documentos que casaram precisam da estrutura para render dos trechos.
  const matchedDocIdsKey = groups
    .map((group) => group.documentId)
    .slice(0, RESULT_PRELOAD_LIMIT)
    .join(",");

  useEffect(() => {
    setResultDocIds((previous) => {
      if (previous.join(",") === matchedDocIdsKey) return previous;
      return matchedDocIdsKey ? matchedDocIdsKey.split(",") : [];
    });
  }, [matchedDocIdsKey]);

  const trimmedTerm = term.trim();
  const hasQuery = trimmedTerm !== "" || conditions.length > 0;
  const totalResults = countResults(groups);

  const handleToggleDoc = useCallback((docId: string) => {
    setExpandedDocIds((previous) =>
      previous.includes(docId)
        ? previous.filter((id) => id !== docId)
        : [...previous, docId],
    );
  }, []);

  const handleSelectElement = useCallback(
    (docId: string, elementId: string) => {
      setSelectedElementId(elementId);

      const document = docCache[docId];
      const element = document?.elements?.find(
        (candidate) => candidate.id === elementId,
      );

      onSelect({
        documentId: docId,
        documentLabel: resolveDocumentLabel(document, docId),
        elementId,
        deviceLabel: formatDeviceKey(element),
        document,
      });
      onBack();
    },
    [docCache, onBack, onSelect],
  );

  const handleBrowse = useCallback((docId: string) => {
    setBrowseDocId(docId);
    setExpandedDocIds((previous) =>
      previous.includes(docId) ? previous : [...previous, docId],
    );
  }, []);

  const handleTermChange = useCallback((value: string) => {
    setTerm(value);
    // Digitar volta para os resultados: os dois modos nunca competem.
    setBrowseDocId(null);
  }, []);

  const clearFilters = useCallback(() => {
    setNormativeType("");
    setActDate("");
    setBrowseDocId(null);
  }, []);

  const browseDocuments = useMemo<LinkTreeDocument[]>(() => {
    if (!browseDocId) return [];

    const label =
      browseDocId === LOCAL_DOCUMENT_ID || docCache[browseDocId]
        ? resolveDocumentLabel(docCache[browseDocId], browseDocId)
        : undefined;

    const listed = documents.find((document) => document.id === browseDocId);
    if (listed) return [{ ...listed, label: label ?? listed.label }];

    return [
      toBrowseDocument(
        browseDocId,
        docCache[browseDocId],
        label ?? `Doc ${browseDocId}`,
      ),
    ];
  }, [browseDocId, documents, docCache]);

  const browseLabel = browseDocuments[0]?.label ?? "";

  const instruction = localElements
    ? "Busque por palavra, expressão ou dispositivo. Cada resultado mostra o dispositivo e o trecho que casou."
    : "Busque por palavra, expressão ou dispositivo para escolher o vínculo.";

  return (
    <InspectorView
      title={title ?? "Vincular dispositivo"}
      onBack={onBack}
      onToggleCollapse={onToggleCollapse}
    >
      <InspectorSection>
        <div className="flex items-center gap-1">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-1.5 top-1.5 h-3 w-3 text-muted-foreground" />
            <Input
              value={term}
              onChange={(event) => handleTermChange(event.target.value)}
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
            {!isSearching && term !== "" && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleTermChange("")}
                title="Limpar busca"
                aria-label="Limpar busca"
                className="absolute right-0 top-0 h-6 w-6 p-0 text-muted-foreground"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Na mesma linha da busca: o disclosure não gasta uma faixa própria. */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters((previous) => !previous)}
            aria-expanded={showFilters}
            title="Filtros avançados"
            className={cn(ui.smallButton, "shrink-0 text-muted-foreground")}
          >
            {showFilters ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            Filtros avançados
            {conditions.length > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {conditions.length}
              </span>
            )}
          </Button>
        </div>

        {showFilters && (
          <div className="space-y-1.5 rounded-sm border p-1.5">
            <InspectorField label="Tipo normativo">
              <Select
                value={normativeType || ANY_NORMATIVE_TYPE}
                onValueChange={(value) =>
                  setNormativeType(value === ANY_NORMATIVE_TYPE ? "" : value)
                }
              >
                <SelectTrigger className={ui.control}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY_NORMATIVE_TYPE}>
                    Qualquer tipo
                  </SelectItem>
                  {NORMATIVE_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </InspectorField>

            <InspectorField
              label="Data do ato"
              hint="Ano completo ou data, ex. 2019 ou 2019-04-30."
            >
              <Input
                value={actDate}
                onChange={(event) => setActDate(event.target.value)}
                placeholder="AAAA-MM-DD"
                aria-label="Data do ato"
                className={ui.control}
              />
            </InspectorField>

            {conditions.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className={cn(ui.smallButton, "text-muted-foreground")}
              >
                <X className="h-3 w-3" />
                Limpar filtros
              </Button>
            )}
          </div>
        )}
      </InspectorSection>

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

      {browseDocId ? (
        <>
          <div className="flex items-center gap-1 border-b px-1.5 py-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setBrowseDocId(null)}
              className={cn(ui.smallButton, "shrink-0 text-muted-foreground")}
            >
              <ArrowLeft className="h-3 w-3" />
              {hasQuery ? "Voltar aos resultados" : "Voltar à busca"}
            </Button>
            <span
              className="min-w-0 flex-1 truncate text-[10px] text-muted-foreground"
              title={browseLabel}
            >
              {browseLabel}
            </span>
          </div>

          <div className="px-1.5 pb-2 pt-1">
            <LinkTree
              documents={browseDocuments}
              expandedDocIds={expandedDocIds}
              onToggleDoc={handleToggleDoc}
              selectionMode="single"
              selectedElementIds={selectedElementId ? [selectedElementId] : []}
              onToggleElement={handleSelectElement}
              highlightTerm={trimmedTerm || undefined}
              density="compact"
              emptyMessage="Estrutura não disponível."
            />
          </div>
        </>
      ) : hasQuery ? (
        <>
          <div className="flex items-center justify-between gap-1 border-b px-3 py-1 text-[10px] text-muted-foreground">
            <span>{formatResultSummary(totalResults, groups.length)}</span>
            {isSearching && (
              <span className="flex shrink-0 items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Buscando…
              </span>
            )}
          </div>

          {totalResults > 0 ? (
            <LinkResultList
              groups={groups}
              term={trimmedTerm}
              selectedElementId={selectedElementId || undefined}
              onSelect={handleSelectElement}
              onBrowse={handleBrowse}
            />
          ) : (
            <InspectorEmpty icon={<Search className="h-4 w-4" />}>
              {isSearching
                ? "Buscando…"
                : "Nenhum dispositivo encontrado. Tente outras palavras ou revise os filtros."}
            </InspectorEmpty>
          )}
        </>
      ) : (
        <>
          <InspectorEmpty icon={<Search className="h-4 w-4" />}>
            {instruction}
          </InspectorEmpty>

          {localElements && (
            <div className="flex justify-center pb-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleBrowse(LOCAL_DOCUMENT_ID)}
                className={ui.smallButton}
              >
                <List className="h-3 w-3" />
                {`Navegar em ${LOCAL_DOCUMENT_LABEL.toLowerCase()}`}
              </Button>
            </div>
          )}
        </>
      )}
    </InspectorView>
  );
}
