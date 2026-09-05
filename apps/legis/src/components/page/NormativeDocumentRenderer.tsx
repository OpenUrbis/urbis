import React, { useMemo, useState } from "react";
import {
  OriginalNormativo,
  NormativeElementEntity,
} from "../../domain/entities";
import { AnnotatedTextSegment } from "../../domain/types";
import { isImageUrl } from "../../services/file-service";
import { NORMATIVE_TYPES } from "../../data/normative-types";
import { format, parse, isValid, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getElementKey } from "../../domain/display-logic";
import {
  applyAnnotatedSegmentsToText,
  getCleanDisplayText,
  normalizeAnnotatedTextSegments,
  stripRedundantLeadingKey,
} from "../../domain/text-utils";
import {
  getSegmentBaseText,
  resolveSegmentsForRender,
} from "../../domain/segment-anchor";
import { cn } from "@open-urbis/map-ui";
import {
  Separator,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@open-urbis/map-ui";
import {
  groupSituationsForElement,
  getElementStyle,
  getElementValiditySummary,
  isValidityNotStarted,
  isValidityEnded,
  parseDate,
} from "./SituationLogic";
import { SituationCard } from "./SituationCard";
import {
  processElementsForConsolidated,
  ViewMode,
  isFutureValidity,
} from "./ConsolidationLogic";
import { processGaps } from "./GapLogic";
import { SmartTableRenderer } from "./SmartTableRenderer";
import { AlertTriangle, ExternalLink, FileText, Layers, Paperclip } from "lucide-react";
import { usePageReferences } from "@/hooks/use-page-references";
import { elementAnchorAttributes } from "../../lib/element-anchor";
import type { PageReference } from "../../domain/page-reference";

export interface LinkedCollectionInfo {
  id: string;
  title: string;
  elementIds: string[];
}

interface NormativeDocumentRendererProps {
  data: OriginalNormativo;
  title?: string;
  viewMode?: ViewMode;
  linkedCollections?: Record<string, LinkedCollectionInfo[]>;
  onSelectElement?: (element: NormativeElementEntity) => void;
}

const INDENT_PER_PARENT_REM = 2;
const COPY_INDENT_ENTITY = "&emsp;";
const COPY_INDENT_MULTIPLIER = 4;
const NON_INDENTING_PARENT_TYPES = new Set([
  "Livro",
  "Título",
  "Titulo",
  "Parte",
  "Seção",
  "Secao",
  "Subseção",
  "Subsecao",
  "Capítulo",
  "Capitulo",
]);

const PARTIAL_LINE_THROUGH_SITUATION_TYPES = new Set([
  "Veto",
  "Revogação",
  "Anulação",
  "Cassação",
  "Perda definitiva de vigor/eficácia",
  "Suspensão de vigor/eficácia",
]);

const PARTIAL_OMISSION_PLACEHOLDERS: Partial<
  Record<NormativeElementEntity["specialSituations"][number]["type"], string>
> = {
  Veto: "(VETADO)",
  Revogação: "(REVOGADO)",
  Anulação: "(ANULADO)",
  Cassação: "(CASSADO)",
  "Perda definitiva de vigor/eficácia": "(SEM VIGOR/EFICÁCIA)",
  "Suspensão de vigor/eficácia": "(SUSPENSO)",
};

function CopyIndentationPrefix({
  indentationLevel = 0,
}: {
  indentationLevel?: number;
}) {
  if (indentationLevel <= 0) return null;

  return (
    <span
      aria-hidden="true"
      className="whitespace-pre text-[0px] leading-none"
      dangerouslySetInnerHTML={{
        __html: COPY_INDENT_ENTITY.repeat(
          indentationLevel * COPY_INDENT_MULTIPLIER,
        ),
      }}
    />
  );
}

export function buildElementDepthMap(elements: NormativeElementEntity[]) {
  const elementsById = new Map(
    elements.map((element) => [element.id, element]),
  );
  const depthMap = new Map<string, number>();

  const getDepth = (elementId?: string, trail = new Set<string>()): number => {
    if (!elementId) return 0;
    if (depthMap.has(elementId)) return depthMap.get(elementId) ?? 0;
    if (trail.has(elementId)) return 0;

    const currentElement = elementsById.get(elementId);
    if (!currentElement?.parentId) {
      depthMap.set(elementId, 0);
      return 0;
    }

    trail.add(elementId);
    const parentElement = elementsById.get(currentElement.parentId);
    const parentDepth = parentElement
      ? getDepth(currentElement.parentId, trail)
      : 0;
    const shouldCountParent = parentElement
      ? !NON_INDENTING_PARENT_TYPES.has(parentElement.type)
      : true;
    const depth = parentDepth + (shouldCountParent ? 1 : 0);
    trail.delete(elementId);

    depthMap.set(elementId, depth);
    return depth;
  };

  elements.forEach((element) => {
    depthMap.set(element.id, getDepth(element.id));
  });

  return depthMap;
}

export function NormativeDocumentRenderer({
  data,
  viewMode = "full",
  linkedCollections = {},
  onSelectElement,
}: NormativeDocumentRendererProps) {
  const normativeTypeLabel = useMemo(
    () => NORMATIVE_TYPES[data.normativeType] ?? data.normativeType,
    [data.normativeType],
  );

  const visibleElements = useMemo(() => {
    const elements =
      viewMode === "full"
        ? data.elements || []
        : processElementsForConsolidated(data.elements || []);

    // Deduplication logic: Hide "Texto" elements that match the title of a subsequent "Tabela", "Figura", or "Mapa"
    return elements.filter((el, idx) => {
      if (el.type === "Texto") {
        const nextEl = elements[idx + 1];
        if (nextEl && ["Tabela", "Figura", "Mapa"].includes(nextEl.type)) {
          const cleanText = el.text?.replace(/<[^>]*>/g, "").trim();
          const cleanNextTitle = nextEl.text?.replace(/<[^>]*>/g, "").trim();
          if (cleanText === cleanNextTitle) return false;
        }
      }
      return true;
    });
  }, [data.elements, viewMode]);

  const { preAnexoElements, postAnexoElements } = useMemo(() => {
    const idx = visibleElements.findIndex((el) => el.type === "Anexo");
    if (idx === -1)
      return { preAnexoElements: visibleElements, postAnexoElements: [] };
    return {
      preAnexoElements: visibleElements.slice(0, idx),
      postAnexoElements: visibleElements.slice(idx),
    };
  }, [visibleElements]);

  const preAnexoWithGaps = useMemo(
    () => processGaps(preAnexoElements),
    [preAnexoElements],
  );
  const postAnexoWithGaps = useMemo(
    () => processGaps(postAnexoElements),
    [postAnexoElements],
  );

  const noteMap = useMemo(() => {
    const map = new Map<string, string[]>();
    data.elements?.forEach((el) => {
      if (el.type === "Nota" && el.noteData) {
        el.noteData.forEach((nd) => {
          const existing = map.get(nd.targetElementId) || [];
          existing.push(el.index || "");
          map.set(nd.targetElementId, existing);
        });
      }
    });
    return map;
  }, [data.elements]);

  const elementDepthMap = useMemo(
    () => buildElementDepthMap(data.elements || []),
    [data.elements],
  );

  /**
   * Situations point at other devices by id. Without this the reader would see a
   * raw identifier (e.g. "lei_lpuos") where a reference belongs.
   */
  const resolveDeviceLabel = useMemo(() => {
    const labelsById = new Map<string, string>();

    data.elements?.forEach((element) => {
      const key = getElementKey(element)
        .replace(/[\s\-–—]+$/, "")
        .trim();
      if (key) labelsById.set(element.id, key);
    });

    return (elementId: string) => labelsById.get(elementId);
  }, [data.elements]);

  /*
   * Ids de origem que não são dispositivos deste documento apontam para outro
   * ato. Resolvidos em lote, viram nome legível e link no cartão da situação.
   */
  const originDocumentIds = useMemo(() => {
    const localIds = new Set(
      (data.elements ?? []).map((element) => element.id),
    );
    const ids = new Set<string>();

    data.elements?.forEach((element) => {
      element.specialSituations?.forEach((situation) => {
        const documentId = situation.sourceDocumentId?.trim();
        if (documentId && !localIds.has(documentId)) ids.add(documentId);

        const relatedId = situation.relatedDeviceId?.trim();
        if (relatedId && !localIds.has(relatedId)) ids.add(relatedId);
      });
    });

    return Array.from(ids);
  }, [data.elements]);

  const resolveOriginDocument = usePageReferences(originDocumentIds);

  const formatNormativeFullDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const parts = dateStr.split(".");
      if (parts.length === 3) {
        const day = parts[0];
        const parsed = parse(dateStr, "dd.MM.yyyy", new Date());
        if (isValid(parsed)) {
          const monthYear = format(parsed, "MMMM 'de' yyyy", { locale: ptBR });
          return `${day} de ${monthYear}`;
        }
      }
      const parsed = parse(dateStr, "dd.MM.yyyy", new Date());
      if (!isValid(parsed)) return dateStr;
      return format(parsed, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const rawDate = data.actDate?.trim() || data.publicationDate?.trim();
  const formattedFullDate = formatNormativeFullDate(rawDate);

  const Epigrafe = () => (
    <div className="font-bold text-center text-xl md:text-2xl leading-snug mb-2">
      {normativeTypeLabel}
      {data.number?.trim() && <span> nº {data.number.trim()}</span>}
      {formattedFullDate && <span> de {formattedFullDate}</span>}
    </div>
  );

  const docStartValidityStr =
    data.originalStartValidity?.date?.trim() ||
    data.publicationDate?.trim() ||
    data.actDate?.trim();
  const docEndValidityStr = data.originalEndValidity?.date?.trim();

  const docStartDate = docStartValidityStr ? parseDate(docStartValidityStr) : null;
  const docEndDate = docEndValidityStr ? parseDate(docEndValidityStr) : null;

  const isDocExpired =
    docEndDate &&
    docEndDate.getTime() > 0 &&
    !isAfter(docEndDate, new Date());

  const isDocFuture =
    docStartDate &&
    docStartDate.getTime() > 0 &&
    isAfter(docStartDate, new Date());

  const docValidityLabel = isDocExpired
    ? `Sem vigência desde ${docEndValidityStr} (norma extinta)`
    : isDocFuture
      ? `Vigência futura: a partir de ${docStartValidityStr}`
      : undefined;

  const documentDate =
    data.actDate || data.publicationDate || data.originalStartValidity?.date;

  return (
    <div className="relative min-h-full">
      <div className="font-serif text-foreground/90 leading-relaxed text-justify grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-x-6 relative z-10 items-start py-6 pl-8">
        {/* Header Section */}
        <header className="col-start-1 min-w-0 mb-2 pr-4 xl:pr-8">
          <Epigrafe />
          {docValidityLabel && (
            <div className="mb-4 flex justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/10 px-2.5 py-0.5 text-[11px] font-sans text-destructive font-medium">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                {docValidityLabel}
              </span>
            </div>
          )}
          <div className="flex mb-4">
            <div
              className="w-1/2 ml-auto text-justify text-base font-medium leading-relaxed"
              dangerouslySetInnerHTML={{ __html: data.ementa || "" }}
            />
          </div>
          {data.preamble && (
            <div
              className="legis-preamble text-sm mb-4 whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: data.preamble }}
            />
          )}
        </header>
        <div className="hidden xl:block col-start-2" />

        {preAnexoWithGaps.map((item, idx) => {
          if (item.type === "Gap")
            return <GapRow key={`pre-${item.id}-${idx}`} />;
          const el = item as NormativeElementEntity;
          return (
            <ElementRow
              key={`pre-${el.id}-${idx}`}
              element={el}
              noteMap={noteMap}
              viewMode={viewMode}
              linkedCollections={linkedCollections}
              onSelect={onSelectElement}
              indentationLevel={elementDepthMap.get(el.id) ?? 0}
              resolveDeviceLabel={resolveDeviceLabel}
              resolveOriginDocument={resolveOriginDocument}
              documentDate={documentDate}
            />
          );
        })}

        {data.signature && (
          <>
            <div
              className="col-start-1 min-w-0 mb-4 text-right italic pr-8 whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: data.signature }}
            />
            <div className="hidden xl:block col-start-2" />
          </>
        )}

        {postAnexoElements.length > 0 && (
          <>
            <div className="col-start-1 min-w-0 pr-4 xl:pr-8">
              <Separator className="my-6" />
              <div className="font-bold text-center mb-4">Anexos</div>
            </div>
            <div className="hidden xl:block col-start-2" />

            {postAnexoWithGaps.map((item, idx) => {
              if (item.type === "Gap")
                return <GapRow key={`post-${item.id}-${idx}`} />;
              const el = item as NormativeElementEntity;
              return (
                <ElementRow
                  key={`post-${el.id}-${idx}`}
                  element={el}
                  noteMap={noteMap}
                  viewMode={viewMode}
                  linkedCollections={linkedCollections}
                  onSelect={onSelectElement}
                  indentationLevel={elementDepthMap.get(el.id) ?? 0}
                  resolveDeviceLabel={resolveDeviceLabel}
                  resolveOriginDocument={resolveOriginDocument}
                  documentDate={documentDate}
                />
              );
            })}
          </>
        )}

        {data.sources && data.sources.length > 0 && (
          <>
            <div className="col-start-1 min-w-0 pr-4 xl:pr-8 mt-8 border-t pt-4">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5 font-sans">
                <Paperclip className="h-3.5 w-3.5" />
                Fontes e Anexos ({data.sources.length})
              </div>
              <div className="flex flex-wrap gap-3">
                {data.sources.map((source, idx) => {
                  const isImg = isImageUrl(source.url || source.name);
                  if (isImg) {
                    return (
                      <div
                        key={idx}
                        className="group relative rounded-lg border bg-card p-1.5 shadow-sm transition-all hover:shadow-md max-w-xs"
                      >
                        <img
                          src={source.url}
                          alt={source.name || "Imagem da fonte"}
                          className="max-h-40 w-full object-cover rounded-md"
                        />
                        <div className="mt-1.5 flex items-center justify-between gap-2 px-1 text-xs font-sans">
                          <span className="truncate font-medium text-foreground">
                            {source.name || "Imagem"}
                          </span>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0 text-primary hover:underline"
                            title="Abrir em nova aba"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs font-sans transition-all hover:bg-muted/70"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="font-medium text-foreground truncate max-w-[220px]">
                        {source.name || source.url}
                      </span>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-1 text-primary hover:underline font-normal inline-flex items-center gap-1 shrink-0"
                      >
                        Abrir <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="hidden xl:block col-start-2" />
          </>
        )}
      </div>
    </div>
  );
}

export function ElementRow({
  element,
  noteMap,
  viewMode = "full",
  linkedCollections,
  onSelect,
  indentationLevel = 0,
  resolveDeviceLabel,
  resolveOriginDocument,
  documentDate,
}: {
  element: NormativeElementEntity;
  noteMap: Map<string, string[]>;
  viewMode?: ViewMode;
  linkedCollections?: Record<string, LinkedCollectionInfo[]>;
  onSelect?: (element: NormativeElementEntity) => void;
  indentationLevel?: number;
  resolveDeviceLabel?: (elementId: string) => string | undefined;
  resolveOriginDocument?: (documentId: string) => PageReference | undefined;
  documentDate?: string;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const groups = useMemo(() => groupSituationsForElement(element), [element]);
  const visibleGroups = useMemo(
    () =>
      viewMode === "full"
        ? groups
        : groups.filter((g) => g.situations.some((s) => isFutureValidity(s))),
    [groups, viewMode],
  );
  const links = linkedCollections?.[element.id];
  const isLinked = links && links.length > 0;
  const isStructural = [
    "Parte",
    "Livro",
    "Título",
    "Capítulo",
    "Seção",
    "Subseção",
    "Divisão desconforme",
    "Anexo",
  ].includes(element.type);
  const topOffset = isStructural ? "top-10" : "top-3";

  return (
    <React.Fragment>
      {/* The transparent left border reserves the space the "linked" edge paints, so the text never shifts. */}
      <div
        {...elementAnchorAttributes(element.id)}
        className={cn(
          "col-start-1 min-w-0 relative group border-l-2 border-transparent pl-2 pr-4 xl:pr-8 transition-colors duration-200",
          isLinked && "border-foreground",
        )}
      >
        {isLinked && (
          <div
            className="absolute -left-8 top-1 cursor-pointer text-muted-foreground hover:text-foreground flex items-center justify-center w-6 h-6 transition-colors"
            onClick={() => setSheetOpen(true)}
          >
            <Layers className="h-4 w-4" />
          </div>
        )}
        <ElementContent
          element={element}
          noteMap={noteMap}
          viewMode={viewMode}
          onSelect={() => onSelect?.(element)}
          indentationLevel={indentationLevel}
          suppressPartialLineThroughOnSegmentedSituations
        />
        <div className="xl:hidden mt-2 ml-4 border-l pl-3 space-y-2">
          {visibleGroups.map((g) => (
            <SituationCard
              key={g.id}
              group={g}
              resolveDeviceLabel={resolveDeviceLabel}
              resolveDocument={resolveOriginDocument}
              documentDate={documentDate}
            />
          ))}
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="w-[400px]">
          <SheetHeader>
            <SheetTitle>Coletâneas Vinculadas</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-3">
            {links?.map((col) => (
              <div
                key={col.id}
                className="border-b pb-2 last:border-b-0 text-sm"
              >
                <div className="font-medium mb-1">{col.title}</div>
                <div className="text-xs text-muted-foreground">
                  ID: {col.id.substring(0, 8)}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <div className="hidden xl:flex col-start-2 flex-col gap-4 pt-0">
        {visibleGroups.map((group) => (
          <div key={group.id} className="relative">
            {/* Hairline tying the margin note to its device; matches the column gap. */}
            <div
              className={`absolute ${topOffset} -left-6 w-6 h-px bg-border`}
            />
            <div
              className={`absolute ${topOffset} -left-6 w-1.5 h-1.5 rounded-full bg-border -translate-x-1/2 -translate-y-1/2`}
            />
            <SituationCard
              group={group}
              resolveDeviceLabel={resolveDeviceLabel}
              resolveDocument={resolveOriginDocument}
              documentDate={documentDate}
            />
          </div>
        ))}
      </div>
    </React.Fragment>
  );
}

export function ElementContent({
  element,
  noteMap,
  onSelect,
  indentationLevel = 0,
  suppressPartialLineThroughOnSegmentedSituations = false,
}: {
  element: NormativeElementEntity;
  noteMap: Map<string, string[]>;
  viewMode?: ViewMode;
  onSelect?: () => void;
  indentationLevel?: number;
  suppressPartialLineThroughOnSegmentedSituations?: boolean;
}) {
  const {
    type,
    index,
    text,
    tableData,
    figureData,
    mapData,
    specialSituations,
    originalEndValidity,
  } = element;
  const safeIndex =
    typeof index === "string"
      ? index.trim()
      : index != null
        ? String(index)
        : "";

  if ((type as string) === "Separator") {
    if (safeIndex === "início" || safeIndex === "fim") {
      return;
    }

    return (
      <div className="text-center text-muted-foreground my-4 font-mono text-sm tracking-widest">
        [...]
      </div>
    );
  }

  let key = getElementKey(element);
  if (type === "Parágrafo")
    key =
      safeIndex === "único" || text?.toLowerCase().startsWith("único")
        ? "Parágrafo único - "
        : safeIndex
          ? `§ ${getElementKey({ ...element, type: "Parágrafo", text: "" })
              .replace(/^§\s*/, "")
              .trim()} - `
          : "";
  else if (type === "Inciso")
    key = getElementKey({ ...element, index: safeIndex });
  else if (type === "Item")
    key = getElementKey({ ...element, index: safeIndex });
  else if (type === "Alínea")
    key = getElementKey({ ...element, index: safeIndex });
  else if (type === "Nota") key = safeIndex ? `(${safeIndex}) - ` : "";

  const isCentered = [
    "Parte",
    "Livro",
    "Título",
    "Capítulo",
    "Seção",
    "Subseção",
    "Divisão desconforme",
    "Anexo",
  ].includes(type);

  const novaRedacaoSituations = (specialSituations || []).filter(
    (s) => s.type === "Nova redação" && s.newText && s.newText.trim() !== "",
  );
  const latestNovaRedacao =
    novaRedacaoSituations.length > 0
      ? novaRedacaoSituations[novaRedacaoSituations.length - 1]
      : undefined;
  const displayText = text;

  const notes = noteMap.get(element.id);
  const noteSuperscript = notes
    ? notes.map((n) => (
        <sup key={n} className="ml-0.5 text-[10px] font-bold text-primary">
          ({n})
        </sup>
      ))
    : null;

  const baseDisplayText = stripRedundantLeadingKey(
    getCleanDisplayText(displayText || "", type, index),
    key,
  );
  // Segments are persisted against the canonical base text, so they must also be
  // measured and applied against it (see domain/segment-anchor.ts).
  const segmentBaseText = getSegmentBaseText({ ...element, text: displayText });
  const situationSegmentGroups = (specialSituations || []).map((situation) => {
    const resolved = resolveSegmentsForRender(segmentBaseText, situation.trechos);
    if (resolved.length > 0) {
      return {
        situation,
        segments: resolved.map((segment) => ({
          ...segment,
          omissionPlaceholder:
            PARTIAL_OMISSION_PLACEHOLDERS[situation.type] ??
            segment.omissionPlaceholder,
        })),
      };
    }

    const placeholder = PARTIAL_OMISSION_PLACEHOLDERS[situation.type];
    const hasOverturn = (specialSituations || []).some(
      (s) =>
        s.type === "Derrubada de veto" ||
        s.type === "Repristinação" ||
        s.type === "Restauração de vigor/eficácia",
    );

    // Only Veto replaces the entire unsegmented element text with placeholder (VETADO)
    if (
      situation.type === "Veto" &&
      placeholder &&
      !hasOverturn &&
      segmentBaseText.trim() &&
      segmentBaseText.trim().toUpperCase() !== placeholder.toUpperCase()
    ) {
      return {
        situation,
        segments: [
          {
            start: 0,
            end: segmentBaseText.length,
            type: "omission" as const,
            omissionPlaceholder: placeholder,
            selectedText: segmentBaseText,
            status: "exact" as const,
          },
        ],
      };
    }

    return { situation, segments: [] };
  });
  const linkedSegments = resolveSegmentsForRender(
    segmentBaseText,
    (element as NormativeElementEntity & { segments?: AnnotatedTextSegment[] })
      .segments,
  );
  const elementSegments = normalizeAnnotatedTextSegments([
    ...linkedSegments,
    ...situationSegmentGroups.flatMap((group) => group.segments),
  ]);
  const partialLineThroughSituations = situationSegmentGroups.filter(
    (group) =>
      PARTIAL_LINE_THROUGH_SITUATION_TYPES.has(group.situation.type) &&
      group.segments.length > 0,
  );
  const hasActivePartialLineThroughSituation =
    partialLineThroughSituations.length > 0 &&
    !(specialSituations || []).some(
      (situation) =>
        situation.type === "Derrubada de veto" ||
        situation.type === "Repristinação" ||
        situation.type === "Restauração de vigor/eficácia",
    );
  const finalDisplayText =
    elementSegments.length > 0
      ? applyAnnotatedSegmentsToText(segmentBaseText, elementSegments, {
          preformatted: true,
        })
      : baseDisplayText;
  const paddingLeft =
    indentationLevel > 0
      ? `${indentationLevel * INDENT_PER_PARENT_REM}rem`
      : undefined;
  const copyIndentationPrefix = (
    <CopyIndentationPrefix indentationLevel={indentationLevel} />
  );

  if (isCentered)
    return (
      <div className="mb-4 mt-6 font-bold text-center">
        {key}
        <span dangerouslySetInnerHTML={{ __html: finalDisplayText }} />
        {noteSuperscript}
      </div>
    );

  let keyDisplay: React.ReactNode = <span className="font-bold">{key}</span>;
  const renumSit = specialSituations?.find((s) => s.type === "Renumeração");
  if (renumSit && renumSit.newIndex)
    keyDisplay = (
      <>
        <span className="line-through font-normal text-muted-foreground">
          {key}
        </span>
        <span className="text-blue-900 ml-1">
          {renumSit.newType || type} {renumSit.newIndex} -{" "}
        </span>
      </>
    );

  /*
      Sem âncora própria: a linha (`ElementRow`) já é o alvo de `#el-<id>` e dois
      nós com o mesmo id fariam o navegador escolher um deles ao acaso. Aqui isto
      é só o conteúdo, reaproveitado também fora do documento (nós de referência).
    */
  if (["Tabela", "Figura", "Mapa"].includes(type))
    return (
      <div className="my-4" style={paddingLeft ? { paddingLeft } : undefined}>
        {type !== "Tabela" && (
          <div className="font-medium mb-2 border-b pb-1 text-base flex items-center gap-2">
            <span dangerouslySetInnerHTML={{ __html: displayText || "" }} />
            {noteSuperscript}
          </div>
        )}
        {type === "Tabela" && tableData && (
          <SmartTableRenderer data={tableData} onSelect={onSelect} />
        )}
        {type === "Figura" && figureData && (
          <div className="flex justify-center border">
            <img
              src={figureData.url}
              alt={text ?? ""}
              style={{
                width: figureData.resolution?.width,
                height: figureData.resolution?.height,
                maxWidth: "100%",
              }}
            />
          </div>
        )}
        {type === "Mapa" && mapData && (
          <div className="space-y-4">
            {mapData.files?.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">
                  {i + 1}
                </span>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-sm text-primary hover:underline"
                >
                  {f.name || `Camada ${i + 1}`}
                </a>
              </div>
            ))}
            {mapData.screen && (
              <div className="flex justify-center">
                <img
                  src={mapData.screen.url}
                  alt={text ?? ""}
                  style={{
                    width: mapData.screen.resolution?.width,
                    height: mapData.screen.resolution?.height,
                    maxWidth: "100%",
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    );

  const baseElementStyle = getElementStyle(element, originalEndValidity) ?? {};
  const validitySummary = getElementValiditySummary(
    element,
    originalEndValidity,
  );
  const elementStyleWithoutPartialLineThroughSituations =
    getElementStyle(
      {
        ...element,
        specialSituations: (specialSituations || []).filter(
          (situation) =>
            !PARTIAL_LINE_THROUGH_SITUATION_TYPES.has(situation.type),
        ),
      },
      originalEndValidity,
    ) ?? {};

  const shouldSuppressLineThroughFromPartialSituation =
    suppressPartialLineThroughOnSegmentedSituations &&
    hasActivePartialLineThroughSituation &&
    baseElementStyle.textDecoration === "line-through" &&
    elementStyleWithoutPartialLineThroughSituations.textDecoration !==
      "line-through";

  const elementStyle = {
    ...(shouldSuppressLineThroughFromPartialSituation
      ? elementStyleWithoutPartialLineThroughSituations
      : baseElementStyle),
    ...(paddingLeft ? { paddingLeft } : {}),
  };

  const showValiditySummaryOnLeft =
    isValidityNotStarted(element) ||
    isValidityEnded(element, originalEndValidity);

  const showNovaRedacao = Boolean(latestNovaRedacao);
  const previousVersionsNovaRedacao = novaRedacaoSituations.slice(0, -1);

  return (
    <div className="mb-2 text-justify relative" style={elementStyle}>
      {copyIndentationPrefix}
      {keyDisplay && <span className="mr-1">{keyDisplay}</span>}
      <span
        className={cn(showNovaRedacao && "line-through text-muted-foreground")}
        dangerouslySetInnerHTML={{ __html: finalDisplayText }}
      />
      {previousVersionsNovaRedacao.map((prev, idx) => (
        <div key={idx} className="line-through text-muted-foreground mt-0.5">
          <span
            dangerouslySetInnerHTML={{
              __html: stripRedundantLeadingKey(
                getCleanDisplayText(prev.newText || "", type, index),
                key,
              ),
            }}
          />
        </div>
      ))}
      {latestNovaRedacao && (
        <div className="text-blue-950 font-normal mt-0.5">
          <span
            dangerouslySetInnerHTML={{
              __html: stripRedundantLeadingKey(
                getCleanDisplayText(latestNovaRedacao.newText || "", type, index),
                key,
              ),
            }}
          />
        </div>
      )}
      {noteSuperscript}
      {showValiditySummaryOnLeft && validitySummary && (
        <span className="ml-2 text-xs text-muted-foreground">
          [{validitySummary}]
        </span>
      )}
    </div>
  );
}

function GapRow() {
  return (
    <div className="text-muted-foreground my-2 font-mono text-sm tracking-widest pl-8">
      [...]
    </div>
  );
}
