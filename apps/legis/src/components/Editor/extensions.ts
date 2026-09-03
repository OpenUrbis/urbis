import {
  StarterKit,
  TiptapImage,
  TaskItem,
  TaskList,
  HorizontalRule,
  Placeholder,
  AIHighlight,
  TextStyle,
  GlobalDragHandle,
} from "novel";

import TiptapLink from "@tiptap/extension-link";
import Color from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";

import { cx } from "class-variance-authority";

import { ActiveBlock } from "./active-block";
import { ReferenceExtension } from "./reference-node";
import { TrechoCapture } from "./trecho-capture";
import { PasteLineBreaks } from "./paste-line-breaks";
import { BlockLines } from "./block-lines";
import {
  getNodeTextMapping,
  locateSegmentInNode,
  type NormativeNodeAttrs,
} from "./node-text-mapping";
import { Extension, Mark, mergeAttributes } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { SpecialSituation } from "../../domain/types";
import { normalizeAnnotatedTextSegments } from "../../domain/text-utils";

const PARTIAL_LINE_THROUGH_SITUATION_TYPES = new Set<SpecialSituation["type"]>([
  "Veto",
  "Revogação",
  "Anulação",
  "Cassação",
  "Perda definitiva de vigor/eficácia",
  "Suspensão de vigor/eficácia",
]);

const PARTIAL_LINE_THROUGH_COUNTER_SITUATION_TYPES = new Set<
  SpecialSituation["type"]
>(["Derrubada de veto", "Repristinação", "Restauração de vigor/eficácia"]);

const PARTIAL_INACTIVE_SEGMENT_CLASS =
  "!line-through !decoration-destructive/50 !text-muted-foreground !opacity-80";

function getSpecialSituationsFromAttrs(
  attrs?: Record<string, unknown>,
): SpecialSituation[] {
  const situations = attrs?.specialSituations;
  return Array.isArray(situations) ? (situations as SpecialSituation[]) : [];
}

function getNormalizedSituationSegments(situation: SpecialSituation) {
  return normalizeAnnotatedTextSegments(situation.trechos);
}

function hasActivePartialLineThroughSituation(situations: SpecialSituation[]) {
  const hasPartialLineThrough = situations.some(
    (situation) =>
      PARTIAL_LINE_THROUGH_SITUATION_TYPES.has(situation.type) &&
      getNormalizedSituationSegments(situation).length > 0,
  );

  return (
    hasPartialLineThrough &&
    !situations.some((situation) =>
      PARTIAL_LINE_THROUGH_COUNTER_SITUATION_TYPES.has(situation.type),
    )
  );
}

function hasFullNodeInactiveSituation(situations: SpecialSituation[]) {
  return situations.some(
    (situation) =>
      PARTIAL_LINE_THROUGH_SITUATION_TYPES.has(situation.type) &&
      getNormalizedSituationSegments(situation).length === 0,
  );
}

function createPartialLineThroughDecorations(
  node: ProseMirrorNode,
  nodePos: number,
  attrs: NormativeNodeAttrs | undefined,
  situations: SpecialSituation[],
) {
  const segments = normalizeAnnotatedTextSegments(
    situations.flatMap((situation) =>
      PARTIAL_LINE_THROUGH_SITUATION_TYPES.has(situation.type)
        ? getNormalizedSituationSegments(situation)
        : [],
    ),
  );

  if (!segments.length || !hasActivePartialLineThroughSituation(situations)) {
    return [];
  }

  const decorations: Decoration[] = [];
  const mapping = getNodeTextMapping(node, nodePos, attrs);

  if (!mapping.fragments.length || !mapping.visibleText.length) {
    return decorations;
  }

  // Located by their stored text, so the strike-through lands on the right words
  // even when `attrs.type` is absent (only `normativeId` is written back into the
  // node by the sync) or the offsets have drifted after an edit.
  segments.forEach((segment) => {
    locateSegmentInNode(mapping, segment).forEach(({ from, to }) => {
      decorations.push(
        Decoration.inline(from, to, { class: PARTIAL_INACTIVE_SEGMENT_CLASS }),
      );
    });
  });

  return decorations;
}

// Extension to add specialSituations attribute to all nodes
const NormativeAttributes = Extension.create({
  name: "normativeAttributes",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("normativePartialSituationDecorations"),
        props: {
          decorations: ({ doc }: { doc: ProseMirrorNode }) => {
            const decorations: Decoration[] = [];

            doc.descendants((node, pos) => {
              const attrs = node.attrs as NormativeNodeAttrs | undefined;
              const situations = getSpecialSituationsFromAttrs(attrs);

              if (!situations.length) {
                return true;
              }

              decorations.push(
                ...createPartialLineThroughDecorations(
                  node,
                  pos,
                  attrs,
                  situations,
                ),
              );
              return true;
            });

            return decorations.length
              ? DecorationSet.create(doc, decorations)
              : DecorationSet.empty;
          },
        },
      }),
    ];
  },

  addGlobalAttributes() {
    return [
      {
        types: [
          "heading",
          "paragraph",
          "listItem",
          "tableRow",
          "table",
          "image",
        ],
        attributes: {
          specialSituations: {
            default: [],
            keepOnSplit: false,
            parseHTML: (element) => {
              const attr = element.getAttribute("data-special-situations");
              try {
                return attr ? JSON.parse(attr) : [];
              } catch {
                return [];
              }
            },
            renderHTML: (attributes) => {
              if (
                !attributes.specialSituations ||
                !Array.isArray(attributes.specialSituations) ||
                attributes.specialSituations.length === 0
              ) {
                return {};
              }

              const situations = attributes.specialSituations as any[];
              const classes: string[] = [];

              // Styling logic based on metadata
              const types = situations.map((s) => s.type);

              const hasVeto = types.includes("Veto");
              const hasDerrubada = types.includes("Derrubada de veto");

              const hasRevocation = types.some((t) =>
                [
                  "Revogação",
                  "Perda definitiva de vigor/eficácia",
                  "Anulação",
                  "Cassação",
                  "Suspensão de vigor/eficácia",
                ].includes(t),
              );
              const hasRestoration = types.some((t) =>
                ["Repristinação", "Restauração de vigor/eficácia"].includes(t),
              );
              const shouldSuppressBlockInactiveStyles =
                hasActivePartialLineThroughSituation(situations) &&
                !hasFullNodeInactiveSituation(situations);

              const isInactive =
                !shouldSuppressBlockInactiveStyles &&
                ((hasVeto && !hasDerrubada) ||
                  (hasRevocation && !hasRestoration));

              // Simple future check for validity
              const isFuture = situations.some((s) => {
                if (
                  [
                    "Vigência inicial alterada",
                    "Vigência final alterada",
                  ].includes(s.type)
                ) {
                  if (s.date && s.date.includes(".")) {
                    try {
                      const [d, m, y] = s.date.split(".");
                      const date = new Date(
                        parseInt(y),
                        parseInt(m) - 1,
                        parseInt(d),
                      );
                      return date > new Date();
                    } catch {
                      return false;
                    }
                  }
                }
                return false;
              });

              const isOrange = types.some((t) =>
                [
                  "Derrubada de veto",
                  "Repristinação",
                  "Restauração de vigor/eficácia",
                ].includes(t),
              );

              const isNew = types.some((t) =>
                [
                  "Nova redação",
                  "Acréscimo",
                  "Renumeração",
                  "Alteração de ementa",
                ].includes(t),
              );

              const isInterpretation = types.some((t) =>
                [
                  "Interpretação conforme à Constituição",
                  "Declaração de inconstitucionalidade sem redução de texto",
                ].includes(t),
              );

              if (isInactive) {
                classes.push(PARTIAL_INACTIVE_SEGMENT_CLASS);
              } else if (isFuture) {
                classes.push("!text-red-600 dark:!text-red-400");
              } else if (isNew) {
                classes.push("!text-blue-700 dark:!text-blue-400 !font-medium");
              } else if (isOrange) {
                classes.push("!text-orange-600 dark:!text-orange-400");
              }

              if (isInterpretation) {
                classes.push(
                  "!underline !decoration-wavy !decoration-amber-500",
                );
              }

              return {
                "data-special-situations": JSON.stringify(
                  attributes.specialSituations,
                ),
                class: classes.join(" "),
              };
            },
          },
          normativeId: {
            default: null,
            keepOnSplit: false,
            parseHTML: (element) => element.getAttribute("data-normative-id"),
            renderHTML: (attributes) => {
              if (!attributes.normativeId) return {};
              return { "data-normative-id": attributes.normativeId };
            },
          },
          type: {
            default: null,
            keepOnSplit: false,
            parseHTML: (element) => element.getAttribute("data-type"),
            renderHTML: (attributes) => {
              if (!attributes.type) return {};

              return { "data-type": attributes.type };
            },
          },
          index: {
            default: null,
            keepOnSplit: false,
            parseHTML: (element) => element.getAttribute("data-index"),
            renderHTML: (attributes) => {
              if (attributes.index == null || attributes.index === "")
                return {};

              return { "data-index": String(attributes.index) };
            },
          },
          originalStartValidity: {
            default: null,
            keepOnSplit: false,
            parseHTML: (element) => {
              const attr = element.getAttribute("data-original-start-validity");
              try {
                return attr ? JSON.parse(attr) : null;
              } catch {
                return null;
              }
            },
            renderHTML: (attributes) => {
              if (!attributes.originalStartValidity) return {};

              return {
                "data-original-start-validity": JSON.stringify(
                  attributes.originalStartValidity,
                ),
              };
            },
          },
          originalEndValidity: {
            default: null,
            keepOnSplit: false,
            parseHTML: (element) => {
              const attr = element.getAttribute("data-original-end-validity");
              try {
                return attr ? JSON.parse(attr) : null;
              } catch {
                return null;
              }
            },
            renderHTML: (attributes) => {
              if (!attributes.originalEndValidity) return {};

              return {
                "data-original-end-validity": JSON.stringify(
                  attributes.originalEndValidity,
                ),
              };
            },
          },
          diffStatus: {
            default: null,
            parseHTML: (element) => element.getAttribute("data-diff-status"),
            renderHTML: (attributes) => {
              if (!attributes.diffStatus) return {};
              const colors = {
                added:
                  "bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500 pl-2",
                removed:
                  "bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 pl-2 opacity-70",
                modified:
                  "bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 pl-2",
              };
              return {
                "data-diff-status": attributes.diffStatus,
                class: colors[attributes.diffStatus as keyof typeof colors],
              };
            },
          },
        },
      },
    ];
  },
});

const tiptapImage = TiptapImage.configure({
  allowBase64: true,
  HTMLAttributes: {
    class: cx("rounded-lg border border-muted"),
  },
});

const taskList = TaskList.configure({
  HTMLAttributes: {
    class: cx("not-prose pl-2"),
  },
});

const taskItem = TaskItem.configure({
  HTMLAttributes: {
    class: cx("flex gap-2 items-start my-4"),
  },
  nested: true,
});

const horizontalRule = HorizontalRule.configure({
  HTMLAttributes: {
    class: cx("mt-4 mb-6 border-t border-muted-foreground/30"),
  },
});

const starterKit = StarterKit.configure({
  bulletList: {
    HTMLAttributes: {
      class: cx("list-disc list-outside leading-3 -mt-2"),
    },
  },
  orderedList: {
    HTMLAttributes: {
      class: cx("list-decimal list-outside leading-3 -mt-2"),
    },
  },
  listItem: {
    HTMLAttributes: {
      class: cx("leading-normal -mb-2"),
    },
  },
  blockquote: {
    HTMLAttributes: {
      class: cx("border-l-4 border-primary"),
    },
  },
  codeBlock: false, // disable default codeBlock to use lowlight
  code: false,
  horizontalRule: false,
  dropcursor: {
    color: "#DBEAFE",
    width: 4,
  },
  gapcursor: false,
});

const placeholder = Placeholder.configure({
  placeholder: "Pressione '/' para comandos...",
  includeChildren: true,
});

const textStyle = TextStyle.configure({
  HTMLAttributes: {
    class: cx("font-medium"),
  },
});

const color = Color.configure({
  types: ["textStyle"],
});

const textAlign = TextAlign.configure({
  types: ["heading", "paragraph", "tableCell", "tableHeader"],
  alignments: ["left", "center", "right", "justify"],
  defaultAlignment: "left",
});

const link = TiptapLink.configure({
  openOnClick: false,
  HTMLAttributes: {
    class: cx(
      "text-muted-foreground underline underline-offset-[3px] hover:text-primary transition-colors cursor-pointer",
    ),
  },
});

const table = Table.configure({
  resizable: true,
  lastColumnResizable: false,
  allowTableNodeSelection: true,
  HTMLAttributes: {
    class: cx("border-collapse table-auto w-full my-4"),
  },
});

const tableRow = TableRow.configure({
  HTMLAttributes: {
    class: cx("border-b border-muted group"),
  },
});

const tableHeader = TableHeader.configure({
  HTMLAttributes: {
    class: cx(
      "border border-muted px-4 py-2 bg-muted/50 font-medium text-left relative",
    ),
  },
});

const tableCell = TableCell.configure({
  HTMLAttributes: {
    class: cx("border border-muted px-4 py-2 relative"),
  },
});

export const UnderlineExtension = Mark.create({
  name: "underline",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: "u",
      },
      {
        style: "text-decoration",
        consuming: false,
        getAttrs: (value) =>
          typeof value === "string" && value.includes("underline")
            ? {}
            : false,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "u",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },

  addCommands(): any {
    return {
      setUnderline:
        () =>
        ({ commands }: any) => {
          return commands.setMark(this.name);
        },
      toggleUnderline:
        () =>
        ({ commands }: any) => {
          return commands.toggleMark(this.name);
        },
      unsetUnderline:
        () =>
        ({ commands }: any) => {
          return commands.unsetMark(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-u": () => (this.editor as any).commands.toggleUnderline(),
      "Mod-U": () => (this.editor as any).commands.toggleUnderline(),
    };
  },
});

export const defaultExtensions = [
  starterKit,
  placeholder,
  tiptapImage,
  taskList,
  taskItem,
  horizontalRule,
  AIHighlight,
  textStyle,
  color,
  textAlign,
  link,
  UnderlineExtension,
  GlobalDragHandle,
  ActiveBlock,
  ReferenceExtension,
  TrechoCapture,
  PasteLineBreaks,
  BlockLines,
  table,
  tableRow,
  tableHeader,
  tableCell,
  NormativeAttributes,
];
