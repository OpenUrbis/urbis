/**
 * Layout and density tokens for the lateral inspector.
 *
 * The inspector replaces the previous stack of dialogs: instead of opening a
 * modal (and a second modal on top of it), each step is a view pushed inside the
 * side panel, and the panel widens for the steps that need room.
 *
 * Widths are written as complete class strings so Tailwind's scanner keeps them.
 */

export type InspectorMode =
  /** Nothing selected: dense outline of the document. */
  | "outline"
  /** One element selected: details and its situations. */
  | "element"
  /** Several elements selected: bulk actions. */
  | "bulk"
  /** Creating or editing a special situation. */
  | "situation"
  /** Marking and adjusting passages. */
  | "trechos"
  /** Picking a linked device in another document. */
  | "link"
  /** Picking an element of this document (parent). */
  | "picker"
  /** Editing raw HTML. */
  | "code";

export const INSPECTOR_WIDTH: Record<InspectorMode, string> = {
  outline: "w-[320px]",
  element: "w-[380px]",
  bulk: "w-[380px]",
  situation: "w-[440px]",
  trechos: "w-[560px]",
  link: "w-[620px]",
  picker: "w-[560px]",
  code: "w-[620px]",
};

export const INSPECTOR_COLLAPSED_WIDTH = "w-10";

/**
 * Compact building blocks, shared so every view looks the same.
 *
 * The panel is deliberately flat: sections are told apart by borders and
 * spacing, never by stacked background tints, and no label is set in caps. The
 * only backgrounds left are the ones that must hide the content behind them
 * (the frame itself) or that carry meaning (marked passages).
 */
export const ui = {
  frame:
    "flex h-full min-h-0 flex-col border-l bg-background transition-[width] duration-200 ease-out max-w-[46vw]",
  header: "flex h-8 shrink-0 items-center gap-1 border-b px-1.5",
  headerTitle: "min-w-0 flex-1 truncate text-[11px] font-medium leading-none",
  headerSubtitle: "shrink-0 text-[10px] font-normal text-muted-foreground",
  iconButton: "h-6 w-6 shrink-0 p-0",
  body: "min-h-0 flex-1 overflow-y-auto overscroll-contain",
  footer: "flex shrink-0 items-center justify-end gap-1 border-t px-1.5 py-1",
  section: "space-y-1.5 border-b px-3 py-2 last:border-b-0",
  sectionTitle: "text-[11px] font-medium leading-none text-foreground",
  label: "text-[10px] font-normal text-muted-foreground",
  field: "space-y-1",
  control: "h-6 text-[11px]",
  text: "text-[11px] leading-relaxed",
  muted: "text-[11px] leading-relaxed text-muted-foreground",
  hint: "text-[10px] leading-snug text-muted-foreground",
  mono: "font-mono text-[10px]",
  /**
   * Dense clickable row, used by the outline and the pickers. The transparent
   * left border reserves the space `rowActive` paints, so selecting a row
   * never shifts the text.
   */
  row: "flex w-full items-start gap-1.5 border-l-2 border-transparent px-3 py-1 text-left transition-colors hover:bg-muted/40",
  /** Selection is shown by weight and an edge, not by a filled background. */
  rowActive: "border-l-2 border-foreground font-medium text-foreground",
  emptyState:
    "flex flex-col items-center gap-1.5 px-4 py-6 text-center text-[11px] text-muted-foreground",
  smallButton: "h-6 gap-1 px-1.5 text-[11px]",
} as const;
