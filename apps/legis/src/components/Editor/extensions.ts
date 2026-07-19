import {
  StarterKit,
  TiptapImage,
  TaskItem,
  TaskList,
  HorizontalRule,
  Placeholder,
  AIHighlight,
  CodeBlockLowlight,
  TextStyle,
  GlobalDragHandle,
} from "novel";

import TiptapLink from '@tiptap/extension-link';
import Color from '@tiptap/extension-color';
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";

import { cx } from "class-variance-authority";
import { common, createLowlight } from "lowlight";
import { ActiveBlock } from "./active-block";
import { ReferenceExtension } from "./reference-node";
import { Extension } from "@tiptap/core";

// Extension to add specialSituations attribute to all nodes
const NormativeAttributes = Extension.create({
  name: 'normativeAttributes',
  
  addGlobalAttributes() {
    return [
      {
        types: ['heading', 'paragraph', 'listItem', 'tableRow', 'table'],
        attributes: {
          specialSituations: {
            default: [],
            keepOnSplit: false,
            parseHTML: element => {
              const attr = element.getAttribute('data-special-situations');
              try {
                return attr ? JSON.parse(attr) : [];
              } catch (e) {
                return [];
              }
            },
            renderHTML: attributes => {
              if (!attributes.specialSituations || !Array.isArray(attributes.specialSituations) || attributes.specialSituations.length === 0) {
                return {};
              }
              
              const situations = attributes.specialSituations as any[];
              const classes: string[] = [];
              
              // Styling logic based on metadata
              const types = situations.map(s => s.type);
              
              const hasVeto = types.includes('Veto');
              const hasDerrubada = types.includes('Derrubada de veto');
              
              const hasRevocation = types.some(t => ['Revogação', 'Perda definitiva de vigor/eficácia', 'Anulação', 'Cassação', 'Suspensão de vigor/eficácia'].includes(t));
              const hasRestoration = types.some(t => ['Repristinação', 'Restauração de vigor/eficácia'].includes(t));
              
              const isInactive = (hasVeto && !hasDerrubada) || (hasRevocation && !hasRestoration);
              
              // Simple future check for validity
              const isFuture = situations.some(s => {
                  if (['Vigência inicial alterada', 'Vigência final alterada'].includes(s.type)) {
                      if (s.date && s.date.includes('.')) {
                          try {
                              const [d, m, y] = s.date.split('.');
                              const date = new Date(parseInt(y), parseInt(m)-1, parseInt(d));
                              return date > new Date();
                          } catch { return false; }
                      }
                  }
                  return false;
              });
              
              const isOrange = types.some(t => ['Derrubada de veto', 'Repristinação', 'Restauração de vigor/eficácia'].includes(t));
              
              const isNew = types.some(t => ['Nova redação', 'Acréscimo', 'Renumeração', 'Alteração de ementa'].includes(t));
              
              const isInterpretation = types.some(t => ['Interpretação conforme à Constituição', 'Declaração de inconstitucionalidade sem redução de texto'].includes(t));

              if (isInactive) {
                  classes.push('!line-through !decoration-destructive/50 !text-muted-foreground !opacity-80');
              } else if (isFuture) {
                  classes.push('!text-red-600 dark:!text-red-400');
              } else if (isNew) {
                  classes.push('!text-blue-700 dark:!text-blue-400 !font-medium');
              } else if (isOrange) {
                  classes.push('!text-orange-600 dark:!text-orange-400');
              }
              
              if (isInterpretation) {
                  classes.push('!underline !decoration-wavy !decoration-amber-500');
              }

              return {
                'data-special-situations': JSON.stringify(attributes.specialSituations),
                'class': classes.join(' ')
              };
            },
          },
          normativeId: {
             default: null,
             keepOnSplit: false,
             parseHTML: element => element.getAttribute('data-normative-id'),
             renderHTML: attributes => {
                if (!attributes.normativeId) return {};
                return { 'data-normative-id': attributes.normativeId };
             }
          },
          diffStatus: {
            default: null,
            parseHTML: element => element.getAttribute('data-diff-status'),
            renderHTML: attributes => {
              if (!attributes.diffStatus) return {};
              const colors = {
                'added': 'bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500 pl-2',
                'removed': 'bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 pl-2 opacity-70',
                'modified': 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 pl-2'
              };
              return { 
                'data-diff-status': attributes.diffStatus,
                'class': colors[attributes.diffStatus as keyof typeof colors]
              };
            }
          }
        },
      },
    ];
  },
});

// Create lowlight instance for code blocks
const lowlight = createLowlight(common);

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
  code: {
    HTMLAttributes: {
      class: cx("rounded-md bg-muted px-1.5 py-1 font-mono font-medium"),
      spellcheck: "false",
    },
  },
  horizontalRule: false,
  dropcursor: {
    color: "#DBEAFE",
    width: 4,
  },
  gapcursor: false,
});

const codeBlockLowlight = CodeBlockLowlight.configure({
  lowlight,
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
  types: ['textStyle'],
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
    class: cx("border border-muted px-4 py-2 bg-muted/50 font-medium text-left relative"),
  },
});

const tableCell = TableCell.configure({
  HTMLAttributes: {
    class: cx("border border-muted px-4 py-2 relative"),
  },
});

export const defaultExtensions = [
  starterKit,
  placeholder,
  tiptapImage,
  taskList,
  taskItem,
  horizontalRule,
  codeBlockLowlight,
  AIHighlight,
  textStyle,
  color,
  link,
  GlobalDragHandle,
  ActiveBlock,
  ReferenceExtension,
  table,
  tableRow,
  tableHeader,
  tableCell,
  NormativeAttributes,
];
