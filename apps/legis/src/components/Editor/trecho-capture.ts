import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import {
  docPosToBaseOffset,
  getNodeTextMapping,
  locateSegmentInNode,
  type NormativeNodeAttrs,
} from "./node-text-mapping";

/**
 * "Modo captura": while active, the inspector highlights the passages being
 * edited directly in the document and turns any selection made in the editor
 * into a new passage. Replaces the previous modal-on-modal flow.
 */

export interface TrechoCaptureSegment {
  start: number;
  end: number;
  type?: "omission" | "supplement";
  /** Stored text of the passage, used to locate it reliably. */
  selectedText?: string;
}

export interface TrechoCaptureState {
  /** `normativeId` of the element whose passages are being edited. */
  elementId: string | null;
  segments: TrechoCaptureSegment[];
  /** Index of the passage currently focused in the inspector list. */
  activeIndex: number | null;
  /** Canonical base text, used to align offsets by content. */
  baseText?: string;
  /** Outlines the element to show where passages may be marked. */
  captureActive?: boolean;
  /**
   * Semantics of the marking. In `citation` the marked passage is what is KEPT
   * (the surroundings are elided), so it is painted as preserved rather than as
   * suppressed.
   */
  mode?: "omission" | "citation";
}

export const TRECHO_CAPTURE_EMPTY_STATE: TrechoCaptureState = {
  elementId: null,
  segments: [],
  activeIndex: null,
};

export const trechoCapturePluginKey = new PluginKey<TrechoCaptureState>(
  "trechoCapture",
);

const SET_STATE_META = "setTrechoCaptureState";

/*
 * A passage is outlined rather than merely tinted: the reader needs to see where
 * it starts and ends, and a background alone is ambiguous when passages sit next
 * to each other. Because a passage can be split across several inline
 * decorations (marks, hard breaks), the side borders are applied only to the
 * first and last range so the outline reads as one continuous box.
 */
const OUTLINE_BASE =
  // `box-decoration-clone` keeps the border closed on every line when the passage
  // wraps; without it the box is drawn open across the line break.
  "box-decoration-clone rounded-sm border-y transition-colors";

const TONE_CLASS = {
  omission: "border-amber-500/80 bg-amber-100/60 dark:bg-amber-400/15",
  citation: "border-emerald-500/80 bg-emerald-100/60 dark:bg-emerald-400/15",
  supplement: "border-sky-500/80 bg-sky-100/60 dark:bg-sky-400/15",
} as const;

const TONE_ACTIVE_CLASS = {
  omission:
    "border-amber-600 bg-amber-200/80 ring-1 ring-amber-600/60 dark:bg-amber-400/25",
  citation:
    "border-emerald-600 bg-emerald-200/80 ring-1 ring-emerald-600/60 dark:bg-emerald-400/25",
  supplement:
    "border-sky-600 bg-sky-200/80 ring-1 ring-sky-600/60 dark:bg-sky-400/25",
} as const;

type OutlineTone = keyof typeof TONE_CLASS;

function getOutlineTone(
  segmentType: TrechoCaptureSegment["type"],
  mode: TrechoCaptureState["mode"],
): OutlineTone {
  if (segmentType === "supplement") return "supplement";
  return mode === "citation" ? "citation" : "omission";
}

function buildOutlineClass(
  tone: OutlineTone,
  active: boolean,
  isFirst: boolean,
  isLast: boolean,
) {
  return [
    OUTLINE_BASE,
    active ? TONE_ACTIVE_CLASS[tone] : TONE_CLASS[tone],
    isFirst ? "border-l pl-[2px]" : "",
    isLast ? "border-r pr-[2px]" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function createBadge(label: number, active: boolean) {
  const badge = document.createElement("span");
  badge.className = [
    "mr-[3px] inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-1",
    "align-middle text-[9px] font-bold leading-none select-none",
    active
      ? "bg-primary text-primary-foreground"
      : "bg-foreground/70 text-background",
  ].join(" ");
  badge.textContent = String(label);
  badge.setAttribute("contenteditable", "false");
  badge.setAttribute("data-trecho-badge", String(label));
  return badge;
}

interface FoundElementNode {
  node: ProseMirrorNode;
  pos: number;
}

function findElementNode(
  doc: ProseMirrorNode,
  elementId: string,
): FoundElementNode | null {
  // Collected into an array because TypeScript cannot narrow a closure variable
  // assigned inside the `descendants` callback.
  const found: FoundElementNode[] = [];

  doc.descendants((node, pos) => {
    if (found.length) return false;

    const attrs = node.attrs as NormativeNodeAttrs | undefined;
    if (attrs?.normativeId === elementId) {
      found.push({ node, pos });
      return false;
    }

    return true;
  });

  return found[0] ?? null;
}

/**
 * Marks the element that accepts passages. Passages are confined to a single
 * element, so showing the boundary up front is better than only complaining
 * after the user selects outside it.
 */
const CAPTURE_SCOPE_CLASS =
  "rounded outline outline-1 outline-dashed outline-offset-4 outline-primary/50";

function buildCaptureDecorations(
  doc: ProseMirrorNode,
  state: TrechoCaptureState,
) {
  if (!state.elementId) return DecorationSet.empty;

  const target = findElementNode(doc, state.elementId);
  if (!target) return DecorationSet.empty;

  const decorations: Decoration[] = [];

  if (state.captureActive) {
    decorations.push(
      Decoration.node(target.pos, target.pos + target.node.nodeSize, {
        class: CAPTURE_SCOPE_CLASS,
      }),
    );
  }

  if (!state.segments.length) {
    return decorations.length
      ? DecorationSet.create(doc, decorations)
      : DecorationSet.empty;
  }

  const mapping = getNodeTextMapping(
    target.node,
    target.pos,
    target.node.attrs as NormativeNodeAttrs,
    state.baseText,
  );

  if (!mapping.fragments.length) {
    return decorations.length
      ? DecorationSet.create(doc, decorations)
      : DecorationSet.empty;
  }

  state.segments.forEach((segment, index) => {
    const isActive = state.activeIndex === index;
    const ranges = locateSegmentInNode(mapping, segment);
    if (!ranges.length) return;

    const type = segment.type === "supplement" ? "supplement" : "omission";
    const tone = getOutlineTone(type, state.mode);

    ranges.forEach(({ from, to }, rangeIndex) => {
      decorations.push(
        Decoration.inline(from, to, {
          class: buildOutlineClass(
            tone,
            isActive,
            rangeIndex === 0,
            rangeIndex === ranges.length - 1,
          ),
          "data-trecho-index": String(index),
        }),
      );
    });

    decorations.push(
      Decoration.widget(
        ranges[0].from,
        () => createBadge(index + 1, isActive),
        {
          side: -1,
          ignoreSelection: true,
        },
      ),
    );
  });

  return decorations.length
    ? DecorationSet.create(doc, decorations)
    : DecorationSet.empty;
}

export const TrechoCapture = Extension.create({
  name: "trechoCapture",

  addProseMirrorPlugins() {
    return [
      new Plugin<TrechoCaptureState>({
        key: trechoCapturePluginKey,
        state: {
          init: () => TRECHO_CAPTURE_EMPTY_STATE,
          apply: (tr, value) => {
            const meta = tr.getMeta(SET_STATE_META) as
              | TrechoCaptureState
              | undefined;
            return meta ?? value;
          },
        },
        props: {
          decorations(editorState) {
            const captureState = trechoCapturePluginKey.getState(editorState);
            if (!captureState) return DecorationSet.empty;
            return buildCaptureDecorations(editorState.doc, captureState);
          },
        },
      }),
    ];
  },
});

/**
 * Pushes the passages currently being edited into the editor so they are
 * highlighted in place. Uses a meta-only transaction: the document is never
 * touched, so this does not dirty the document or create undo steps.
 */
export function setTrechoCaptureState(
  editor: { view: { dispatch: (tr: unknown) => void; state: any } } | null,
  state: TrechoCaptureState,
) {
  if (!editor?.view) return;

  const { tr } = editor.view.state;
  tr.setMeta(SET_STATE_META, state);
  tr.setMeta("addToHistory", false);
  editor.view.dispatch(tr);
}

export interface CapturedSelection {
  elementId: string;
  selectedText: string;
  /** Offset in the element's canonical base text; used to disambiguate. */
  hintOffset: number;
  /** The selection reached past the element and was clipped to it. */
  truncated: boolean;
}

export type CaptureOutcome =
  | ({ status: "captured" } & CapturedSelection)
  /** The selection belongs to a different element. */
  | { status: "outside"; elementId: string | null }
  /** No usable selection. */
  | { status: "empty" };

/**
 * Reads the current editor selection as a candidate passage, **restricted to the
 * element being edited**.
 *
 * Only the start of the selection identifies the element, so a drag that begins
 * inside the element and ends past it would otherwise capture text belonging to
 * the following elements. The range is therefore clipped to the node's own text.
 *
 * Returns the selected text plus a hint offset rather than final offsets: the
 * caller resolves it against the canonical base text via `locateTextInBase`,
 * which keeps a single source of truth for offsets.
 */
export function readSelectionInElement(
  editor: any,
  expectedElementId?: string | null,
  baseText?: string,
): CaptureOutcome {
  if (!editor?.state) return { status: "empty" };

  const { state } = editor;
  const { from, to, empty } = state.selection;
  if (empty || to <= from) return { status: "empty" };

  const resolved = state.doc.resolve(from);
  let nodePos: number | null = null;
  let node: ProseMirrorNode | null = null;

  for (let depth = resolved.depth; depth > 0; depth -= 1) {
    const candidate = resolved.node(depth);
    const attrs = candidate.attrs as NormativeNodeAttrs | undefined;

    if (attrs?.normativeId) {
      node = candidate;
      nodePos = resolved.before(depth);
      break;
    }
  }

  if (!node || nodePos === null) return { status: "outside", elementId: null };

  const elementId = String(
    (node.attrs as NormativeNodeAttrs).normativeId ?? "",
  );
  if (!elementId) return { status: "outside", elementId: null };
  if (expectedElementId && elementId !== expectedElementId) {
    return { status: "outside", elementId };
  }

  // Clip to the node's own text range: positions inside the node run from
  // `nodePos + 1` to the end of its content.
  const nodeFrom = nodePos + 1;
  const nodeTo = nodePos + node.nodeSize - 1;
  const clippedFrom = Math.max(from, nodeFrom);
  const clippedTo = Math.min(to, nodeTo);
  if (clippedTo <= clippedFrom) return { status: "empty" };

  const selectedText = state.doc
    .textBetween(clippedFrom, clippedTo, "\n", " ")
    .trim();
  if (!selectedText) return { status: "empty" };

  const mapping = getNodeTextMapping(
    node,
    nodePos,
    node.attrs as NormativeNodeAttrs,
    baseText,
  );
  const hintOffset = docPosToBaseOffset(mapping, clippedFrom) ?? 0;

  return {
    status: "captured",
    elementId,
    selectedText,
    hintOffset,
    truncated: clippedFrom !== from || clippedTo !== to,
  };
}

/** Whether the element being edited exists as a node in the document. */
export function hasElementNode(editor: any, elementId: string): boolean {
  if (!editor?.state?.doc || !elementId) return false;
  return !!findElementNode(editor.state.doc, elementId);
}

/**
 * Scrolls the document to the element itself, for "ir para o texto base".
 *
 * Unlike `focusTrechoInEditor` this needs no passage: it is the way back from
 * the panel to the device under work, which is easily off screen once the
 * document is long and the panel is scrolled to its own content.
 *
 * Returns `false` when the element has no node in the document (an element may
 * exist in the metadata and not yet in the text), so the caller can disable the
 * affordance instead of offering a button that does nothing.
 */
export function scrollToElementInEditor(
  editor: any,
  elementId: string,
): boolean {
  if (!editor?.state?.doc || !elementId) return false;

  const target = findElementNode(editor.state.doc, elementId);
  if (!target) return false;

  /*
   * Scrolling the DOM node directly leaves the selection and the undo history
   * untouched: this is navigation, not an edit. Probing for `scrollIntoView`
   * rather than for `HTMLElement` keeps this usable outside a browser.
   */
  const dom = editor.view?.nodeDOM?.(target.pos) as
    | { scrollIntoView?: (options?: unknown) => void; parentElement?: unknown }
    | null
    | undefined;

  const node = (dom?.scrollIntoView ? dom : dom?.parentElement) as
    | { scrollIntoView?: (options?: unknown) => void }
    | undefined;

  if (node?.scrollIntoView) {
    node.scrollIntoView({ behavior: "smooth", block: "center" });
    return true;
  }

  /* No DOM to reach (headless, or node not rendered yet): move the selection. */
  editor
    .chain?.()
    .setTextSelection(target.pos + 1)
    .scrollIntoView()
    .run();
  return true;
}

/** Scrolls the editor to a passage and selects it, for "ver no texto". */
export function focusTrechoInEditor(
  editor: any,
  elementId: string,
  segment: TrechoCaptureSegment,
  baseText?: string,
) {
  if (!editor?.state) return;

  const target = findElementNode(editor.state.doc, elementId);
  if (!target) return;

  const mapping = getNodeTextMapping(
    target.node,
    target.pos,
    target.node.attrs as NormativeNodeAttrs,
    baseText,
  );
  const ranges = locateSegmentInNode(mapping, segment);
  if (!ranges.length) return;

  const from = ranges[0].from;
  const to = ranges[ranges.length - 1].to;

  editor.chain().setTextSelection({ from, to }).scrollIntoView().run();
}
