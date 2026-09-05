import React, { useCallback, useMemo, useRef, useState } from "react";
import NovelEditorWrapper from "./index";
import { Editor as TiptapEditor, JSONContent } from "@tiptap/core";
import { Link as LinkIcon, Code, PlusCircle } from "lucide-react";
import { suggestionItems as defaultSuggestionItems } from "./slash-command";
import {
  CollectionLink,
  NormativeElementEntity,
  OriginalNormativo,
} from "../../domain/entities";
import type { AnnotatedTextSegment } from "../../domain/types";
import { getElementKey } from "../../domain/display-logic";
import { getSegmentBaseText } from "../../domain/segment-anchor";
import { buildRetainedExcerpt } from "../../domain/text-utils";
import type { LinkPickerSelection } from "../inspector/LinkPickerView";
import { parse, isValid, compareAsc } from "date-fns";
import { useInspectorTaskRequest } from "../inspector/inspector-task-context";
import { RulesEngine } from "../../domain/rules-engine";

interface LegisEditorProps {
  initialContent?: JSONContent;
  onChange?: (content: JSONContent) => void;
  onEditorReady?: (editor: TiptapEditor) => void;
  readOnly?: boolean;
  isNormative?: boolean;
  className?: string;
  /** Elements of the current document, so a link can point inside it. */
  localElements?: NormativeElementEntity[];
}

export function LegisEditor({
  initialContent,
  onChange,
  onEditorReady,
  readOnly = false,
  isNormative = false,
  className,
  localElements,
}: LegisEditorProps) {
  const [editor, setEditor] = useState<TiptapEditor | null>(null);
  const { request } = useInspectorTaskRequest();
  /** Position of the reference node being edited, if any. */
  const editingNodePosRef = useRef<number | null>(null);
  /** Cursor position where an asynchronous addition command must be inserted. */
  const acrescimoInsertPosRef = useRef<number | null>(null);

  // Auto-normalize ordinals on change (if normative)
  const handleContentChange = useCallback(
    (newContent: JSONContent) => {
      if (onChange) onChange(newContent);
    },
    [onChange],
  );

  const handleCollectionLinkSave = useCallback(
    (links: CollectionLink[], cache: Record<string, OriginalNormativo>) => {
      if (!editor) return;
      const editingNodePos = editingNodePosRef.current;
      // Sort Documents by Date (Publication or Act)
      const getDate = (doc?: OriginalNormativo) => {
        if (!doc) return new Date(0);
        const dateStr = doc.publicationDate || doc.actDate;
        if (!dateStr) return new Date(0);
        try {
          const d = parse(dateStr, "dd.MM.yyyy", new Date());
          return isValid(d) ? d : new Date(0);
        } catch {
          return new Date(0);
        }
      };

      const sortedLinks = [...links].sort((a, b) => {
        const dateA = getDate(cache[a.resourceId]);
        const dateB = getDate(cache[b.resourceId]);
        return compareAsc(dateA, dateB);
      });

      const contentToInsert: JSONContent[] = [];

      sortedLinks.forEach((link, lIndex) => {
        const doc = cache[link.resourceId];
        const docDescriptor =
          doc?.name?.trim() || doc?.title?.trim() || doc?.ementa?.trim();
        const docLabel = doc
          ? doc.number
            ? `${doc.normativeType} ${doc.number} ${doc.actDate ? `- ${doc.actDate}` : ""}`
            : docDescriptor
              ? docDescriptor.substring(0, 20) + "..."
              : "Documento"
          : `Doc ${link.resourceId}`;

        if (link.linkedElements && link.linkedElements.length > 0) {
          // Sort Linked Elements by order in Original
          const docElements = doc?.elements || [];
          const sortedLinkedElements = [...link.linkedElements].sort((a, b) => {
            const idxA = docElements.findIndex((e) => e.id === a.elementId);
            const idxB = docElements.findIndex((e) => e.id === b.elementId);
            if (idxA === -1) return 1;
            if (idxB === -1) return -1;
            return idxA - idxB;
          });

          // Collect element IDs
          const elementIds = sortedLinkedElements.map((le) => le.elementId);

          // Collect segments
          const segmentsMap: Record<string, any> = {};
          sortedLinkedElements.forEach((le) => {
            if (le.segments && le.segments.length > 0) {
              segmentsMap[le.elementId] = le.segments;
            }
          });

          // Collect preloaded data
          const groupedElements: any[] = [];
          const selectedSet = new Set(elementIds);

          if (doc?.elements) {
            doc.elements.forEach((el) => {
              if (selectedSet.has(el.id)) {
                // Push Element (with segments)
                const segments = segmentsMap[el.id];
                groupedElements.push({
                  ...el,
                  segments: segments,
                });
              }
            });
          }

          contentToInsert.push({
            type: "reference",
            attrs: {
              pageId: link.resourceId,
              elementIds: elementIds,
              label: docLabel,
              groupedElements: groupedElements,
              segmentsMap: segmentsMap,
            },
          });
        } else {
          // Whole doc linked
          const docText =
            doc?.name?.trim() ||
            doc?.title?.trim() ||
            doc?.ementa ||
            docLabel;
          contentToInsert.push({
            type: "reference",
            attrs: {
              pageId: link.resourceId,
              elementId: "root",
              label: docLabel,
              text: docText,
            },
          });
        }

        // Add separator between documents if needed (e.g. newline)
        if (lIndex < sortedLinks.length - 1) {
          contentToInsert.push({
            type: "paragraph",
            content: [], // Empty paragraph as spacer
          });
        }
      });

      if (contentToInsert.length > 0) {
        if (editingNodePos !== null) {
          // Replace existing node(s)
          // Note: If multiple docs returned (splitting one link into multiple), we replace the single node with multiple nodes.
          // We assume editingNodePos points to the start of the reference node.
          // We need to delete it first.
          // Since we don't have the node size here easily without finding it again:
          const node = editor.state.doc.nodeAt(editingNodePos);
          if (node) {
            editor
              .chain()
              .deleteRange({
                from: editingNodePos,
                to: editingNodePos + node.nodeSize,
              })
              .insertContentAt(editingNodePos, contentToInsert)
              .run();
          } else {
            // Fallback insert if node not found
            editor.chain().focus().insertContent(contentToInsert).run();
          }
          editingNodePosRef.current = null;
        } else {
          // Insert new
          editor.chain().focus().insertContent(contentToInsert).run();
        }
      } else if (editingNodePos !== null) {
        // Remove existing node when all links are deselected/cleared
        const node = editor.state.doc.nodeAt(editingNodePos);
        if (node) {
          editor
            .chain()
            .deleteRange({
              from: editingNodePos,
              to: editingNodePos + node.nodeSize,
            })
            .run();
        }
        editingNodePosRef.current = null;
      }
    },
    [editor],
  );

  /** Opens the link step in the inspector, seeded with the existing links. */
  const requestLinks = useCallback(
    (initialLinks: CollectionLink[]) => {
      request({
        kind: "links",
        title: "Vínculos normativos",
        initialLinks,
        localElements,
        onResolve: handleCollectionLinkSave,
      });
    },
    [request, localElements, handleCollectionLinkSave],
  );

  const handleEditLink = useCallback(
    (node: any, getPos: () => number) => {
      const { pageId, elementIds, segmentsMap } = node.attrs;

      const link: CollectionLink = {
        resourceId: pageId,
        resourceType: "original_normativo",
        linkedElements:
          elementIds?.map((id: string) => ({
            elementId: id,
            segments: segmentsMap?.[id],
          })) || [],
      };

      editingNodePosRef.current = getPos();
      requestLinks([link]);
    },
    [requestLinks],
  );

  const handleEditorReady = useCallback(
    (instance: TiptapEditor) => {
      setEditor(instance);

      if ((instance.storage as any).reference) {
        (instance.storage as any).reference.onEdit = handleEditLink;
      }

      if (onEditorReady) onEditorReady(instance);
    },
    [handleEditLink, onEditorReady],
  );

  const rulesEngine = useMemo(() => new RulesEngine(), []);

  const insertAcréscimoFromSource = useCallback(
    (selection: LinkPickerSelection, sourceSegments: AnnotatedTextSegment[]) => {
      if (!editor) return;

      const sourceElement = selection.document?.elements?.find(
        (candidate) => candidate.id === selection.elementId,
      );
      const sourceBaseText = sourceElement
        ? getSegmentBaseText(sourceElement)
        : "";
      const sourceText = sourceSegments.length
        ? buildRetainedExcerpt(sourceBaseText, sourceSegments)
        : sourceBaseText;

      if (!sourceText.trim()) {
        acrescimoInsertPosRef.current = null;
        return;
      }

      // The structure comes from the linked source Element too. This avoids
      // asking for a second, conflicting "new element" text/index in a prompt.
      const parseText = sourceElement
        ? `${getElementKey(sourceElement)}${sourceText}`
        : sourceText;
      const parsed = rulesEngine.parseLine(parseText);
      const elementId = `el-${Date.now()}`;
      const situation = {
        type: "Acréscimo" as const,
        sourceDocumentId: selection.documentId,
        sourceDocumentLabel: selection.documentLabel,
        relatedDeviceId: selection.elementId,
        normativeElementId: selection.elementId,
        dispositivo: selection.deviceLabel || selection.elementId,
        device: selection.deviceLabel || selection.elementId,
        sourceTrechos: sourceSegments,
        newText: sourceText,
        date: "",
      };

      const content = {
        type: "paragraph",
        attrs: {
          normativeId: elementId,
          specialSituations: [situation],
          type: parsed.type,
          index: parsed.index,
        },
        content: [
          {
            type: "text",
            text: sourceText.trim(),
          },
        ],
      };
      const insertionPosition = acrescimoInsertPosRef.current;

      const chain = editor.chain().focus();
      if (insertionPosition !== null) {
        chain.insertContentAt(insertionPosition, content).run();
      } else {
        chain.insertContent(content).run();
      }
      acrescimoInsertPosRef.current = null;
    },
    [acrescimoInsertPosRef, editor, rulesEngine],
  );

  const customSuggestionItems = useMemo(
    () => [
      ...defaultSuggestionItems,
      {
        title: "Acréscimo Normativo",
        description: "Vincular o Elemento de origem e selecionar o trecho acrescido",
        searchTerms: ["acréscimo", "acrescimo", "adicionar", "incluir", "inserir", "dispositivo", "norma"],
        icon: <PlusCircle size={18} />,
        command: ({ editor: instance, range }: any) => {
          instance.chain().focus().deleteRange(range).run();
          acrescimoInsertPosRef.current = instance.state.selection.from;
          request({
            kind: "acrescimo",
            title: "Elemento normativo que acrescenta",
            localElements,
            onResolve: insertAcréscimoFromSource,
          });
        },
      },
      {
        title: "Vínculo Normativo",
        description: "Pesquisar e inserir referência a outra norma",
        searchTerms: ["link", "vinculo", "norma", "referencia"],
        icon: <LinkIcon size={18} />,
        command: ({ editor: instance, range }: any) => {
          editingNodePosRef.current = null;
          instance.chain().focus().deleteRange(range).run();
          requestLinks([]);
        },
      },
      {
        title: "Inserir HTML",
        description: "Inserir código HTML cru",
        searchTerms: ["html", "codigo", "embed"],
        icon: <Code size={18} />,
        command: ({ editor: instance, range }: any) => {
          instance.chain().focus().deleteRange(range).run();
          request({
            kind: "html",
            title: "Inserir HTML",
            onResolve: (html) => {
              if (!html.trim()) return;
              instance.chain().focus().insertContent(html).run();
            },
          });
        },
      },
    ],
    [insertAcréscimoFromSource, localElements, request, requestLinks],
  );

  return (
    <div className={className}>
      <NovelEditorWrapper
        initialValue={initialContent}
        onChange={handleContentChange}
        editable={!readOnly}
        onEditorReady={handleEditorReady}
        isNormative={isNormative}
        suggestionItems={customSuggestionItems}
      />
    </div>
  );
}
