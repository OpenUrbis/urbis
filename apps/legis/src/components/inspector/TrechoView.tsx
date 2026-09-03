import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Badge, Button, Input, cn } from "@open-urbis/map-ui";
import {
  AlertTriangle,
  Anchor,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Eye,
  Highlighter,
  Merge,
  Quote,
  TextSelect,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import type {
  AnnotatedTextSegment,
  SpecialSituationType,
} from "../../domain/types";
import {
  adjustSegmentEdgeByWord,
  findSegmentOverlaps,
  isSegmentValid,
  locateTextInBase,
  mergeOverlappingSegments,
  resolveSegments,
  snapRangeToWordBoundaries,
  withSegmentAnchor,
  type ResolvedSegment,
  type SegmentEdge,
  type SegmentEdgeDirection,
} from "../../domain/segment-anchor";
import {
  applyAnnotatedSegmentsToText,
  buildAnnotatedSegmentsExcerpt,
  buildRetainedExcerpt,
} from "../../domain/text-utils";
import {
  TRECHO_CAPTURE_EMPTY_STATE,
  focusTrechoInEditor,
  hasElementNode,
  readSelectionInElement,
  scrollToElementInEditor,
  setTrechoCaptureState,
  type TrechoCaptureSegment,
} from "../Editor/trecho-capture";
import {
  InspectorEmpty,
  InspectorSection,
  InspectorView,
} from "./InspectorShell";
import { ui } from "./inspector-tokens";
import { getSituationTypeConfig } from "./situation-config";

/**
 * Marking and adjusting passages ("trechos") as an inspector view.
 *
 * Replaces the `SegmentSelector` modal: instead of re-reading the element text
 * inside a dialog (a second text pipeline, with its own offsets), the passages
 * are selected in the document itself and mirrored back as decorations. The
 * panel only ever holds UI state — the passages themselves live in the caller.
 *
 * The same view serves the two opposite meanings a marked passage can have:
 *
 * - `omission`  — passages of the AFFECTED element: what is marked is suppressed
 *                 and replaced by "(VETADO)"/"[...]";
 * - `citation`  — passages of the SOURCE act: what is marked is KEPT and the text
 *                 around it is elided with "[...]". A veto message usually holds
 *                 several provisions, so quoting it means keeping either the whole
 *                 element, a few parts of it, or one small fragment.
 */

/** Which of the two opposite meanings a marked passage carries. */
export type TrechoMarkingMode = "omission" | "citation";

export interface TrechoViewProps {
  /** Texto canônico do elemento (já vem de getSegmentBaseText). */
  baseText: string;
  /** normativeId do elemento, para a captura no editor. */
  elementId: string;
  /** Referência legível do elemento, ex. "Art. 1º". */
  elementLabel: string;
  /** Tipo da situação, define rótulo do trecho e placeholder de omissão. */
  situationType: SpecialSituationType;
  /** Trechos já marcados. */
  segments: AnnotatedTextSegment[];
  onChange: (segments: AnnotatedTextSegment[]) => void;
  onBack: () => void;
  /** Instância do Tiptap; quando ausente, a captura no editor fica desabilitada. */
  editor?: unknown;
  onToggleCollapse?: () => void;
  /**
   * Semântica da marcação. Default `'omission'`, para não mudar o
   * comportamento de quem já usa a view.
   */
  mode?: TrechoMarkingMode;
}

/**
 * The prop is `unknown` so callers can forward the editor without dragging
 * Tiptap's types into every intermediate component. Everything this view needs
 * is structural, so a single local cast keeps it honest without `any`.
 */
interface CaptureEditor {
  on: (event: "selectionUpdate", handler: () => void) => void;
  off: (event: "selectionUpdate", handler: () => void) => void;
  view: {
    dispatch: (tr: unknown) => void;
    state: unknown;
    dom: HTMLElement;
  };
}

/** Shorter than this is almost always an accidental drag, not a passage. */
const MIN_CAPTURE_LENGTH = 2;

type SegmentType = "omission" | "supplement";

interface EdgeControl {
  edge: SegmentEdge;
  direction: SegmentEdgeDirection;
  icon: LucideIcon;
  label: string;
}

const EDGE_CONTROLS: EdgeControl[] = [
  {
    edge: "start",
    direction: "expand",
    icon: ChevronLeft,
    label: "Expandir início em uma palavra",
  },
  {
    edge: "start",
    direction: "shrink",
    icon: ChevronRight,
    label: "Encolher início em uma palavra",
  },
  {
    edge: "end",
    direction: "shrink",
    icon: ChevronLeft,
    label: "Encolher fim em uma palavra",
  },
  {
    edge: "end",
    direction: "expand",
    icon: ChevronRight,
    label: "Expandir fim em uma palavra",
  },
];

const TYPE_LABEL: Record<TrechoMarkingMode, Record<SegmentType, string>> = {
  omission: { omission: "Omissão", supplement: "Suplementação" },
  // "Omissão" would be a lie here: in a citation the marked passage is exactly
  // what survives.
  citation: { omission: "Citado", supplement: "Suplementação" },
};

/**
 * Tone of the passage-type toggle. In `omission` the hues mirror the decoration
 * colours of the `trechoCapture` extension. In `citation` the marked passage is
 * what is preserved, so it gets a "kept" tone instead — the editor decorations
 * still use amber, since their classes live in `trecho-capture.ts` (see the note
 * on `mirrorSegments`).
 *
 * Only the border and the text carry the colour: the panel has no filled chips.
 */
const TYPE_BADGE_CLASS: Record<
  TrechoMarkingMode,
  Record<SegmentType, string>
> = {
  omission: {
    omission:
      "border-amber-500/60 text-amber-700 dark:border-amber-400/50 dark:text-amber-300",
    supplement:
      "border-sky-500/60 text-sky-700 dark:border-sky-400/50 dark:text-sky-300",
  },
  citation: {
    // Emerald reads as "kept", the inverse of amber's "dropped".
    omission:
      "border-emerald-500/60 text-emerald-700 dark:border-emerald-400/50 dark:text-emerald-300",
    supplement:
      "border-sky-500/60 text-sky-700 dark:border-sky-400/50 dark:text-sky-300",
  },
};

const TYPE_TOGGLE_TITLE: Record<TrechoMarkingMode, string> = {
  omission: "Alternar entre omissão e suplementação",
  citation: "Alternar entre citação e suplementação",
};

/**
 * Tone of the passages drawn inside the panel's own selectable text. This is a
 * functional highlight — it says where the marked text is — so it keeps a fill
 * even though the rest of the panel has none.
 */
const FALLBACK_HIGHLIGHT_CLASS: Record<TrechoMarkingMode, string> = {
  omission: "rounded-sm bg-amber-200/70 dark:bg-amber-400/25",
  citation: "rounded-sm bg-emerald-200/70 dark:bg-emerald-400/25",
};

const FALLBACK_HIGHLIGHT_ACTIVE_CLASS: Record<TrechoMarkingMode, string> = {
  omission: "ring-1 ring-amber-600/70",
  citation: "ring-1 ring-emerald-600/70",
};

/**
 * Whether the citation covers the element as a whole or only marked passages.
 * This is the distinction the domain makes explicit: linking a source act often
 * means quoting all of it, and that must be a state the user can see and choose,
 * not merely "no passages marked yet".
 */
type CitationScope = "whole" | "specific";

const CITATION_SCOPES: { value: CitationScope; label: string }[] = [
  { value: "whole", label: "Elemento inteiro" },
  { value: "specific", label: "Trechos específicos" },
];

function segmentType(segment: AnnotatedTextSegment): SegmentType {
  return segment.type === "supplement" ? "supplement" : "omission";
}

/** Identity that survives the re-sorting `resolveSegments` performs. */
function segmentKey(segment: AnnotatedTextSegment): string {
  return `${segment.start}:${segment.end}:${segmentType(segment)}`;
}

function toPlainSegment(segment: ResolvedSegment): AnnotatedTextSegment {
  const { status, originalStart, originalEnd, ...plain } = segment;
  return plain;
}

interface TextRun {
  text: string;
  /** Position in the passage list, when this run belongs to a passage. */
  index?: number;
}

/**
 * Splits the base text into runs so the panel's own text can show where the
 * passages are. Without an editor to mirror (the source act is a different
 * document) this is the only place the user sees what is already marked.
 *
 * The runs concatenate back to exactly `baseText`: no badge or separator is
 * injected, so `selection.toString()` and the hint offset measured against the
 * container keep matching the canonical text.
 */
function buildTextRuns(
  baseText: string,
  resolved: ResolvedSegment[],
): TextRun[] {
  const ranges = resolved
    .map((segment, index) => ({ segment, index }))
    .filter(
      ({ segment }) => segment.status !== "lost" && segment.end > segment.start,
    )
    .sort(
      (a, b) =>
        a.segment.start - b.segment.start || a.segment.end - b.segment.end,
    );

  const runs: TextRun[] = [];
  let cursor = 0;

  ranges.forEach(({ segment, index }) => {
    const start = Math.max(cursor, Math.min(segment.start, baseText.length));
    const end = Math.max(start, Math.min(segment.end, baseText.length));
    // Overlapping passages: whatever a previous run already covered is skipped,
    // so the text is never duplicated on screen.
    if (end <= start) return;

    if (start > cursor) runs.push({ text: baseText.slice(cursor, start) });
    runs.push({ text: baseText.slice(start, end), index });
    cursor = end;
  });

  if (cursor < baseText.length) runs.push({ text: baseText.slice(cursor) });

  return runs;
}

export function TrechoView({
  baseText,
  elementId,
  elementLabel,
  situationType,
  segments,
  onChange,
  onBack,
  editor,
  onToggleCollapse,
  mode = "omission",
}: TrechoViewProps) {
  const captureEditor = editor as CaptureEditor | undefined;
  const config = getSituationTypeConfig(situationType);
  const isCitation = mode === "citation";

  const [captureActive, setCaptureActive] = useState(true);
  /**
   * Whether the user asked to narrow a citation down to specific passages. Only
   * meaningful while nothing is marked: as soon as a passage exists the scope is
   * unambiguously "specific".
   */
  const [wantsSpecificTrechos, setWantsSpecificTrechos] = useState(false);
  /**
   * Why the last capture attempt did not do what the user expected. Passages are
   * confined to the element being edited, so a selection that reaches outside it
   * needs an explanation rather than silence.
   */
  const [captureNotice, setCaptureNotice] = useState<
    "outside" | "truncated" | null
  >(null);
  /**
   * Whether the element exists as a node in the document. When it does not, no
   * decoration can be drawn and the user deserves to be told why.
   */
  const elementInDocument = useMemo(
    () => (captureEditor ? hasElementNode(captureEditor, elementId) : false),
    [captureEditor, elementId],
  );
  const [activeKey, setActiveKey] = useState<string | null>(null);
  /** Uncommitted note text, so trimming on normalization does not fight typing. */
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const fallbackRef = useRef<HTMLDivElement>(null);

  const resolution = useMemo(
    () => resolveSegments(baseText, segments),
    [baseText, segments],
  );
  const resolved = resolution.segments;
  const items = useMemo(() => resolved.map(toPlainSegment), [resolved]);

  const activeIndex = useMemo(() => {
    if (!activeKey) return null;
    const index = resolved.findIndex(
      (segment) => segmentKey(segment) === activeKey,
    );
    return index === -1 ? null : index;
  }, [resolved, activeKey]);

  const baseTextRef = useRef(baseText);
  const itemsRef = useRef(items);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    baseTextRef.current = baseText;
    itemsRef.current = items;
    onChangeRef.current = onChange;
  }, [baseText, items, onChange]);

  /* ---------------------------------------------------------------------- */
  /* Citation scope                                                          */
  /* ---------------------------------------------------------------------- */

  const citationScope: CitationScope =
    items.length > 0 || wantsSpecificTrechos ? "specific" : "whole";
  /** Marking only makes sense once the citation is narrower than the element. */
  const markingEnabled = !isCitation || citationScope === "specific";

  const selectCitationScope = useCallback(
    (next: CitationScope) => {
      setWantsSpecificTrechos(next === "specific");
      // Going back to the whole element means dropping the passages: the citation
      // reproduces everything, so keeping stale marks would misreport it.
      if (next === "whole" && items.length) onChange([]);
    },
    [items.length, onChange],
  );

  /* ---------------------------------------------------------------------- */
  /* Mutations (always derived from the resolved list, never from local state) */
  /* ---------------------------------------------------------------------- */

  const replaceSegment = useCallback(
    (index: number, next: AnnotatedTextSegment) => {
      setActiveKey(segmentKey(next));
      onChange(
        items.map((segment, position) => (position === index ? next : segment)),
      );
    },
    [items, onChange],
  );

  const removeSegment = useCallback(
    (index: number) => {
      onChange(items.filter((_, position) => position !== index));
    },
    [items, onChange],
  );

  const toggleSegmentType = useCallback(
    (index: number) => {
      const segment = items[index];
      if (!segment) return;

      const nextType: SegmentType =
        segmentType(segment) === "supplement" ? "omission" : "supplement";
      replaceSegment(index, {
        ...segment,
        type: nextType,
        supplementText:
          nextType === "supplement" ? segment.supplementText : undefined,
        text:
          nextType === "supplement"
            ? segment.supplementText
            : segment.selectedText,
      });
    },
    [items, replaceSegment],
  );

  const adjustEdge = useCallback(
    (index: number, edge: SegmentEdge, direction: SegmentEdgeDirection) => {
      const segment = items[index];
      if (!segment) return;
      replaceSegment(
        index,
        adjustSegmentEdgeByWord(baseText, segment, edge, direction),
      );
    },
    [baseText, items, replaceSegment],
  );

  const setNote = useCallback(
    (index: number, value: string) => {
      const segment = items[index];
      if (!segment) return;

      setNoteDrafts((drafts) => ({ ...drafts, [segmentKey(segment)]: value }));
      onChange(
        items.map((current, position) =>
          position === index
            ? { ...current, supplementText: value, text: value }
            : current,
        ),
      );
    },
    [items, onChange],
  );

  const commitNote = useCallback((segment: AnnotatedTextSegment) => {
    setNoteDrafts((drafts) => {
      const key = segmentKey(segment);
      if (!(key in drafts)) return drafts;
      const { [key]: _dropped, ...rest } = drafts;
      return rest;
    });
  }, []);

  /**
   * Turns a raw selection into a passage. Reads from refs so the editor
   * listener never closes over a stale segment list.
   */
  const captureText = useCallback(
    (selectedText: string, hintOffset?: number): boolean => {
      const base = baseTextRef.current;
      const located = locateTextInBase(base, selectedText, hintOffset);
      if (!located) return false;

      const snapped = snapRangeToWordBoundaries(
        base,
        located.start,
        located.end,
      );
      if (snapped.end <= snapped.start) return false;

      const current = itemsRef.current;
      const candidate = withSegmentAnchor(base, {
        ...snapped,
        type: "omission",
      });
      const duplicate = current.some(
        (segment) =>
          segment.start === candidate.start &&
          segment.end === candidate.end &&
          segmentType(segment) === "omission",
      );
      if (duplicate) {
        setActiveKey(segmentKey(candidate));
        return false;
      }

      setActiveKey(segmentKey(candidate));
      onChangeRef.current([...current, candidate]);
      return true;
    },
    [],
  );

  /* ---------------------------------------------------------------------- */
  /* Editor wiring                                                           */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!captureEditor || !captureActive || !markingEnabled) return;

    const dom = captureEditor.view?.dom;
    if (!dom) return;

    const capture = () => {
      const outcome = readSelectionInElement(
        captureEditor,
        elementId,
        baseTextRef.current,
      );

      if (outcome.status === "outside") {
        setCaptureNotice("outside");
        return;
      }

      if (outcome.status === "empty") return;
      if (outcome.selectedText.trim().length < MIN_CAPTURE_LENGTH) return;

      const added = captureText(outcome.selectedText, outcome.hintOffset);
      setCaptureNotice(added && outcome.truncated ? "truncated" : null);
    };

    /*
     * Deliberately NOT listening to `selectionUpdate`: it fires on every
     * intermediate selection while the mouse is being dragged, so selecting
     * "programa municipal" would create one passage per character along the
     * way. Capturing when the gesture ends is both correct and predictable.
     */
    const handleMouseUp = () => capture();

    const handleKeyUp = (event: KeyboardEvent) => {
      // Shift released ends a keyboard selection; Enter is an explicit commit.
      if (event.key === "Shift" || event.key === "Enter") capture();
    };

    dom.addEventListener("mouseup", handleMouseUp);
    dom.addEventListener("keyup", handleKeyUp);

    return () => {
      dom.removeEventListener("mouseup", handleMouseUp);
      dom.removeEventListener("keyup", handleKeyUp);
    };
  }, [captureEditor, captureActive, markingEnabled, elementId, captureText]);

  /**
   * The editor decorations still use the omission tone: their classes live in
   * `trecho-capture.ts`, which only knows `omission | supplement`. See the note
   * on `TrechoCaptureState` in the review notes for the API this would need.
   */
  const mirrorSegments = useMemo<TrechoCaptureSegment[]>(
    () =>
      resolved.map((segment) =>
        // A lost passage keeps its stale offsets, which would highlight the wrong
        // characters; collapsing the range drops the decoration while keeping the
        // list and the badge numbers aligned.
        segment.status === "lost"
          ? { start: 0, end: 0, type: segmentType(segment) }
          : {
              start: segment.start,
              end: segment.end,
              type: segmentType(segment),
              // The stored text is what makes the highlight land on the right
              // characters even when the offsets have drifted.
              selectedText: segment.selectedText,
            },
      ),
    [resolved],
  );

  useEffect(() => {
    if (!captureEditor) return;
    setTrechoCaptureState(captureEditor, {
      elementId,
      segments: mirrorSegments,
      activeIndex,
      baseText,
      captureActive: captureActive && markingEnabled,
    });
  }, [
    captureEditor,
    elementId,
    mirrorSegments,
    activeIndex,
    baseText,
    captureActive,
    markingEnabled,
  ]);

  useEffect(
    () => () => {
      if (captureEditor)
        setTrechoCaptureState(captureEditor, TRECHO_CAPTURE_EMPTY_STATE);
    },
    [captureEditor],
  );

  /* ---------------------------------------------------------------------- */
  /* Fallback selection inside the panel                                     */
  /* ---------------------------------------------------------------------- */

  const handleFallbackSelection = useCallback(() => {
    if (!markingEnabled) return;

    const container = fallbackRef.current;
    const selection =
      typeof window !== "undefined" ? window.getSelection() : null;
    if (!container || !selection || selection.rangeCount === 0) return;
    if (!selection.anchorNode || !selection.focusNode) return;
    if (
      !container.contains(selection.anchorNode) ||
      !container.contains(selection.focusNode)
    )
      return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    const selectedText = selection.toString();
    if (!selectedText.trim()) return;

    // Only a hint: the real offsets come from `locateTextInBase`, so a stray
    // character of DOM whitespace cannot shift the passage.
    const preSelection = range.cloneRange();
    preSelection.selectNodeContents(container);
    preSelection.setEnd(range.startContainer, range.startOffset);
    const hintOffset = preSelection.toString().length;

    if (captureText(selectedText, hintOffset)) selection.removeAllRanges();
  }, [captureText, markingEnabled]);

  const handleFallbackKeyUp = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      // Keyboard selection ends either when Shift is released (shift+arrows) or
      // when the user commits explicitly with Enter.
      if (event.key !== "Shift" && event.key !== "Enter") return;
      handleFallbackSelection();
    },
    [handleFallbackSelection],
  );

  /* ---------------------------------------------------------------------- */
  /* Derived UI data                                                         */
  /* ---------------------------------------------------------------------- */

  const overlaps = useMemo(() => findSegmentOverlaps(items), [items]);

  /** Passages that can actually be rendered; a lost one has no usable range. */
  const applicable = useMemo(
    () =>
      resolved
        .filter((segment) => segment.status !== "lost")
        .map(toPlainSegment),
    [resolved],
  );

  const previewHtml = useMemo(() => {
    if (isCitation) return "";

    const segmentsToApply = applicable.length
      ? applicable.map((plain) =>
          segmentType(plain) === "supplement"
            ? plain
            : {
                ...plain,
                omissionPlaceholder:
                  plain.omissionPlaceholder ?? config.omissionPlaceholder,
              },
        )
      : config.omissionPlaceholder && baseText.trim()
        ? [
            {
              start: 0,
              end: baseText.length,
              type: "omission" as const,
              omissionPlaceholder: config.omissionPlaceholder,
              selectedText: baseText,
            },
          ]
        : [];

    if (!segmentsToApply.length) return "";

    // `applyAnnotatedSegmentsToText` returns the raw text untouched when there
    // is nothing to apply, so the unescaped path is never rendered.
    return applyAnnotatedSegmentsToText(baseText, segmentsToApply, {
      preformatted: true,
    });
  }, [isCitation, baseText, applicable, config.omissionPlaceholder]);

  /**
   * Plain text on purpose: `buildRetainedExcerpt` is the citation as it will be
   * quoted, so it is rendered as text instead of markup.
   */
  const previewText = useMemo(
    () => (isCitation ? buildRetainedExcerpt(baseText, applicable) : ""),
    [isCitation, baseText, applicable],
  );

  const textRuns = useMemo(
    () => buildTextRuns(baseText, resolved),
    [baseText, resolved],
  );

  const excerpt = useMemo(() => buildAnnotatedSegmentsExcerpt(items), [items]);
  const invalidCount = items.filter(
    (segment) => !isSegmentValid(segment),
  ).length;
  const trechoLabel = config.trechoLabel ?? "Trechos";
  const listTitle = isCitation ? "Trechos citados" : trechoLabel;

  return (
    <InspectorView
      title={isCitation ? "Citação" : "Trechos"}
      subtitle={elementLabel}
      onBack={onBack}
      backLabel="Voltar para a situação"
      onToggleCollapse={onToggleCollapse}
      actions={
        <Button
          variant="ghost"
          size="sm"
          className={ui.iconButton}
          onClick={() => scrollToElementInEditor(captureEditor, elementId)}
          disabled={!elementInDocument}
          title={
            elementInDocument
              ? "Ir para o texto no documento"
              : "Elemento ainda não existe no texto"
          }
        >
          <Crosshair className="h-3.5 w-3.5" />
        </Button>
      }
      footer={
        <>
          <span
            className={cn(ui.hint, "mr-auto")}
            data-trecho-count={items.length}
          >
            {isCitation && citationScope === "whole"
              ? "Citação do elemento inteiro"
              : items.length === 1
                ? "1 trecho"
                : `${items.length} trechos`}
            {invalidCount > 0 && (
              <span className="ml-1 text-destructive">
                {invalidCount === 1
                  ? "· 1 incompleto"
                  : `· ${invalidCount} incompletos`}
              </span>
            )}
          </span>
          <Button
            variant="outline"
            size="sm"
            className={ui.smallButton}
            onClick={onBack}
          >
            Concluir
          </Button>
        </>
      }
    >
      {isCitation && (
        <InspectorSection title="Abrangência da citação">
          <div
            className="inline-flex gap-0.5 rounded-md border p-0.5"
            role="group"
            aria-label="Abrangência da citação"
            data-citation-scope={citationScope}
          >
            {CITATION_SCOPES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => selectCitationScope(value)}
                aria-pressed={citationScope === value}
                data-citation-scope-option={value}
                className={cn(
                  "rounded border border-transparent px-2 py-0.5 text-[11px] leading-4 transition-colors",
                  citationScope === value
                    ? "border-foreground font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <p className={ui.hint}>
            {citationScope === "whole"
              ? `Todo o texto de ${elementLabel} é reproduzido na citação.`
              : "O trecho marcado é o que fica na citação; o texto em volta é substituído por “[...]”."}
          </p>
        </InspectorSection>
      )}

      {isCitation && citationScope === "whole" ? (
        <InspectorSection>
          <div
            className={cn(
              "flex items-start gap-1.5 rounded-md border px-2 py-1.5 text-[11px] leading-relaxed",
              "border-emerald-500/50 text-emerald-700",
              "dark:border-emerald-400/40 dark:text-emerald-300",
            )}
            role="status"
            data-citation-whole="true"
          >
            <Quote className="mt-0.5 h-3 w-3 shrink-0" />
            <span>
              <strong className="font-medium">
                A citação é o elemento inteiro.
              </strong>{" "}
              Todo o texto de {elementLabel} é reproduzido, sem cortes. Escolha
              “Trechos específicos” para citar apenas partes dele.
            </span>
          </div>
        </InspectorSection>
      ) : captureEditor ? (
        <InspectorSection>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                ui.smallButton,
                // Pressed state without a fill: the edge and the weight carry it.
                captureActive
                  ? "border-foreground font-medium text-foreground"
                  : "text-muted-foreground",
              )}
              onClick={() => setCaptureActive((active) => !active)}
              aria-pressed={captureActive}
              data-capture-active={captureActive}
            >
              <Highlighter className="h-3 w-3" />
              Capturar no texto
            </Button>
            <span className={ui.hint}>
              {captureActive
                ? `Selecione o trecho dentro de ${elementLabel}, no texto ao lado.`
                : "Captura desligada; a seleção no texto não marca trechos."}
            </span>
          </div>

          {captureNotice && (
            <div
              className="flex items-start gap-1 rounded border px-1.5 py-1 text-[11px] text-amber-700 dark:text-amber-300"
              role="status"
              data-capture-notice={captureNotice}
            >
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              <span>
                {captureNotice === "outside"
                  ? `A seleção está fora de ${elementLabel}. Só é possível marcar trechos deste elemento.`
                  : `A seleção passava de ${elementLabel} e foi limitada a este elemento.`}
              </span>
            </div>
          )}

          {!elementInDocument && (
            <div
              className="flex items-start gap-1 rounded border px-1.5 py-1 text-[11px] text-amber-700 dark:text-amber-300"
              role="status"
              data-trecho-node-missing="true"
            >
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              <span>
                Este elemento não foi encontrado no texto do editor, então os
                trechos não aparecem destacados. Use “Auto-Estruturar” para
                vincular o texto à estrutura.
              </span>
            </div>
          )}
        </InspectorSection>
      ) : (
        <InspectorSection
          title={isCitation ? "Texto de origem" : "Texto do dispositivo"}
        >
          <p className={ui.hint}>
            {isCitation
              ? "Selecione abaixo o que deve ficar na citação. Vale mouse ou Shift + setas."
              : "Selecione o trecho no texto abaixo."}
          </p>
          <div
            ref={fallbackRef}
            tabIndex={0}
            role="textbox"
            aria-readonly="true"
            aria-label={
              isCitation
                ? "Texto de origem para seleção dos trechos citados"
                : "Texto do dispositivo para seleção de trechos"
            }
            onMouseUp={handleFallbackSelection}
            onKeyUp={handleFallbackKeyUp}
            data-trecho-source="panel"
            className={cn(
              ui.text,
              isCitation ? "max-h-64" : "max-h-48",
              "select-text overflow-y-auto whitespace-pre-wrap rounded-md border p-2",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            )}
          >
            {textRuns.map((run, position) =>
              run.index === undefined ? (
                run.text
              ) : (
                <span
                  key={`run-${position}`}
                  data-trecho-highlight={run.index}
                  title={`Trecho ${run.index + 1}`}
                  className={cn(
                    FALLBACK_HIGHLIGHT_CLASS[mode],
                    activeIndex === run.index &&
                      FALLBACK_HIGHLIGHT_ACTIVE_CLASS[mode],
                  )}
                >
                  {run.text}
                </span>
              ),
            )}
          </div>
        </InspectorSection>
      )}

      {overlaps.length > 0 && (
        <InspectorSection>
          <div className="flex items-center gap-1.5" data-trecho-overlap="true">
            <AlertTriangle className="h-3 w-3 shrink-0 text-amber-600" />
            <span className={cn(ui.hint, "flex-1")}>
              Há trechos sobrepostos; a prévia pode sair confusa.
            </span>
            <Button
              variant="outline"
              size="sm"
              className={ui.smallButton}
              onClick={() =>
                onChange(mergeOverlappingSegments(baseText, items))
              }
            >
              <Merge className="h-3 w-3" />
              Mesclar
            </Button>
          </div>
        </InspectorSection>
      )}

      {markingEnabled && (
        <InspectorSection title={listTitle}>
          {resolved.length === 0 ? (
            <InspectorEmpty
              icon={
                isCitation ? (
                  <Quote className="h-6 w-6" />
                ) : (
                  <TextSelect className="h-6 w-6" />
                )
              }
            >
              {isCitation
                ? "Nenhum trecho marcado ainda. Selecione no texto o que deve ficar na citação; o restante aparece como “[...]”."
                : "Nenhum trecho marcado. Selecione um trecho do texto para marcá-lo; sem trechos, a situação atinge todo o dispositivo."}
            </InspectorEmpty>
          ) : (
            <div className="divide-y rounded-md border">
              {resolved.map((segment, index) => (
                <SegmentRow
                  key={`${segmentKey(segment)}:${index}`}
                  index={index}
                  segment={segment}
                  mode={mode}
                  active={activeIndex === index}
                  noteDraft={noteDrafts[segmentKey(segment)]}
                  canFocusInEditor={Boolean(captureEditor)}
                  onActivate={() => setActiveKey(segmentKey(segment))}
                  onToggleType={() => toggleSegmentType(index)}
                  onAdjustEdge={(edge, direction) =>
                    adjustEdge(index, edge, direction)
                  }
                  onNoteChange={(value) => setNote(index, value)}
                  onNoteCommit={() => commitNote(segment)}
                  onRemove={() => removeSegment(index)}
                  onFocusInEditor={() => {
                    setActiveKey(segmentKey(segment));
                    if (captureEditor) {
                      focusTrechoInEditor(
                        captureEditor,
                        elementId,
                        {
                          start: segment.start,
                          end: segment.end,
                          type: segmentType(segment),
                          selectedText: segment.selectedText,
                        },
                        baseText,
                      );
                    }
                  }}
                />
              ))}
            </div>
          )}
        </InspectorSection>
      )}

      {isCitation
        ? previewText && (
            <InspectorSection title="Citação resultante">
              {/*
               * Rendered as text, not markup: `buildRetainedExcerpt` returns the
               * plain citation, and the source text is untrusted input.
               */}
              <div
                className={cn(
                  ui.text,
                  "whitespace-pre-wrap rounded-md border p-2",
                )}
                data-trecho-preview="true"
              >
                {previewText}
              </div>
              <p className={ui.hint}>
                {citationScope === "whole"
                  ? "O elemento é citado por completo."
                  : "Só o que está marcado é reproduzido; “[...]” indica o texto em volta."}
              </p>
            </InspectorSection>
          )
        : previewHtml && (
            <InspectorSection title="Como vai ficar">
              <div
                className={cn(ui.text, "rounded-md border p-2")}
                data-trecho-preview="true"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
              {excerpt && (
                <p className={ui.hint} data-trecho-excerpt="true">
                  Resumo registrado: {excerpt}
                </p>
              )}
            </InspectorSection>
          )}
    </InspectorView>
  );
}

interface SegmentRowProps {
  index: number;
  segment: ResolvedSegment;
  mode: TrechoMarkingMode;
  active: boolean;
  noteDraft?: string;
  canFocusInEditor: boolean;
  onActivate: () => void;
  onToggleType: () => void;
  onAdjustEdge: (edge: SegmentEdge, direction: SegmentEdgeDirection) => void;
  onNoteChange: (value: string) => void;
  onNoteCommit: () => void;
  onRemove: () => void;
  onFocusInEditor: () => void;
}

function SegmentRow({
  index,
  segment,
  mode,
  active,
  noteDraft,
  canFocusInEditor,
  onActivate,
  onToggleType,
  onAdjustEdge,
  onNoteChange,
  onNoteCommit,
  onRemove,
  onFocusInEditor,
}: SegmentRowProps) {
  const type = segmentType(segment);
  const lost = segment.status === "lost";
  const valid = isSegmentValid(segment) && !lost;
  const missingNote = type === "supplement" && !segment.supplementText?.trim();

  return (
    <div
      className={cn(
        // The transparent left edge is reserved so highlighting the active
        // row never shifts its text; `border-l-*` keeps the divider colour.
        "space-y-1 border-l-2 border-l-transparent px-3 py-1.5 transition-colors",
        active && "border-l-foreground",
      )}
      onMouseEnter={onActivate}
      onFocusCapture={onActivate}
      data-trecho-index={index}
      data-trecho-status={segment.status}
      data-invalid={valid ? undefined : "true"}
    >
      <div className="flex items-center gap-1">
        <span
          className={cn(
            "inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full border px-1",
            "text-[9px] leading-none",
            active
              ? "border-foreground font-medium text-foreground"
              : "text-muted-foreground",
          )}
        >
          {index + 1}
        </span>

        <button
          type="button"
          onClick={onToggleType}
          title={TYPE_TOGGLE_TITLE[mode]}
          className={cn(
            "shrink-0 rounded-full border px-1.5 text-[10px] font-medium leading-4 transition-colors",
            TYPE_BADGE_CLASS[mode][type],
          )}
        >
          {TYPE_LABEL[mode][type]}
        </button>

        {segment.status === "reanchored" && (
          <Badge
            variant="outline"
            className="shrink-0 gap-1 px-1.5 py-0 text-[9px] font-medium leading-4"
            title="Os offsets estavam defasados e o trecho foi localizado pelo texto."
          >
            <Anchor className="h-2.5 w-2.5" />
            reancorado
          </Badge>
        )}

        <span className="ml-auto flex shrink-0 items-center">
          {EDGE_CONTROLS.map(({ edge, direction, icon: Icon, label }) => (
            <Button
              key={`${edge}-${direction}`}
              variant="ghost"
              size="sm"
              className={cn(
                ui.iconButton,
                edge === "end" && direction === "shrink" && "ml-1",
              )}
              onClick={() => onAdjustEdge(edge, direction)}
              disabled={lost}
              title={label}
              aria-label={label}
            >
              <Icon className="h-3 w-3" />
            </Button>
          ))}
        </span>

        {canFocusInEditor && (
          <Button
            variant="ghost"
            size="sm"
            className={ui.iconButton}
            onClick={onFocusInEditor}
            disabled={lost}
            title="Ver no texto"
            aria-label="Ver no texto"
          >
            <Eye className="h-3 w-3" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          className={cn(ui.iconButton, "text-destructive")}
          onClick={onRemove}
          title="Remover trecho"
          aria-label="Remover trecho"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      <p
        className={cn(ui.text, "line-clamp-2 break-words")}
        title={segment.selectedText}
      >
        {segment.selectedText || (
          <span className={ui.muted}>Trecho sem texto registrado</span>
        )}
      </p>

      {/* Manual offset adjustment controls */}
      <div className="flex items-center gap-2 pt-1 text-[10px] text-muted-foreground">
        <span>Início: <strong className="font-mono text-foreground">{segment.start}</strong></span>
        <span>Fim: <strong className="font-mono text-foreground">{segment.end}</strong></span>
        <span className="ml-auto font-sans text-[10px]">Ajustar limites de seleção</span>
      </div>

      {type === "supplement" && (
        <div className="space-y-0.5">
          <Input
            value={noteDraft ?? segment.supplementText ?? ""}
            onChange={(event) => onNoteChange(event.target.value)}
            onBlur={onNoteCommit}
            placeholder="Nota do trecho suplementado, ex. 15,4m"
            aria-label={`Nota do trecho ${index + 1}`}
            aria-invalid={missingNote || undefined}
            className={cn(ui.control, missingNote && "border-destructive")}
          />
          {missingNote && (
            <p className="text-[10px] leading-snug text-destructive">
              Informe a nota; ela aparece entre colchetes no texto.
            </p>
          )}
        </div>
      )}

      {lost && (
        <div className="flex items-center gap-1" data-trecho-lost="true">
          <AlertTriangle className="h-3 w-3 shrink-0 text-destructive" />
          <span className="flex-1 text-[10px] leading-snug text-destructive">
            Trecho não encontrado no texto atual.
          </span>
          <Button
            variant="outline"
            size="sm"
            className={ui.smallButton}
            onClick={onRemove}
          >
            Remover
          </Button>
        </div>
      )}
    </div>
  );
}
