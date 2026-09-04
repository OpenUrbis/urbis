import React, { useEffect, useState } from "react";
import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import {
  pageService,
  NormativeSearchResult,
} from "../../services/page-service";
import type { OriginalNormativo } from "../../domain/entities";
import { ElementContent } from "../page/NormativeDocumentRenderer";
import { NormativeListHeader } from "../common/NormativeListHeader";
import { processGapsUnified } from "../page/GapLogic";
import { Button } from "@open-urbis/map-ui";
import { Edit, Trash2 } from "lucide-react";

const ReferenceComponent = ({ node, editor, getPos }: any) => {
  const {
    pageId,
    elementId,
    elementIds,
    label,
    text,
    groupedElements,
    segmentsMap,
  } = node.attrs;

  // Single element state
  const [data, setData] = useState<NormativeSearchResult | null>(
    text
      ? {
          pageId,
          elementId,
          type: "Ref",
          text,
          pageTitle: label,
        }
      : null,
  );

  // Grouped elements state
  const [groupData, setGroupData] = useState<any[]>(
    groupedElements ? groupedElements : [],
  );

  const [pageTitle, setPageTitle] = useState(label || "");
  const [fullDoc, setFullDoc] = useState<any>(null);

  useEffect(() => {
    // Group Logic
    if (elementIds && elementIds.length > 0 && pageId) {
      // Always fetch fresh data to support live updates
      pageService.getById(pageId).then((page) => {
        if (page && page.type === "original_normativo" && page.entity) {
          const original = page.entity as OriginalNormativo;
          const resolvedName =
            original.name?.trim() ||
            original.title?.trim() ||
            page.title?.trim();
          setFullDoc({
            ...original,
            name: resolvedName,
            title: resolvedName,
          });
          setPageTitle(page.title);

          // Rebuild groupData from live doc
          const elements: any[] = [];
          const selectedSet = new Set(elementIds);
          const docElements = (page.entity as any).elements || [];

          docElements.forEach((el: any) => {
            if (selectedSet.has(el.id)) {
              const segments = segmentsMap?.[el.id];
              elements.push({
                ...el,
                segments: segments,
              });
            }
          });

          setGroupData(elements);
        }
      });
      return;
    }

    // Single Logic (Legacy/Fallback)
    if (text) return;
    if (pageId && elementId && elementId !== "root") {
      pageService.getById(pageId).then((page) => {
        if (page && page.type === "original_normativo" && page.entity) {
          setPageTitle(page.title);
          const el = (page.entity as any).elements?.find(
            (e: any) => e.id === elementId,
          );
          if (el) {
            setData({
              pageId: page.id,
              pageTitle: page.title,
              elementId: elementId,
              type: el.type,
              text: el.text,
            });
          }
        }
      });
    } else if (pageId && elementId === "root") {
      pageService.getById(pageId).then((page) => {
        if (page) {
          setPageTitle(page.title);
          const entity = page.entity as any;
          setData({
            pageId: page.id,
            pageTitle: page.title,
            elementId: "root",
            type: "Documento",
            text:
              entity?.name?.trim() ||
              entity?.title?.trim() ||
              page.title?.trim() ||
              entity?.ementa,
          });
        }
      });
    }
  }, [pageId, elementId, elementIds, text, segmentsMap]);

  const renderItemContent = (item: any) => {
    if (item.type === "Gap") {
      // if start or end not who gaps no show [...]
      if (item.id === "gap-start" || item.id === "gap-end") {
        return;
      }
      return (
        <div className="text-muted-foreground my-2 font-mono text-sm tracking-widest pl-8">
          [...]
        </div>
      );
    }

    // Reuse ElementContent for consistent rendering (styles, keys, strikethrough, etc.)
    return (
      <div className="text-foreground/90 leading-relaxed font-serif text-justify">
        <ElementContent
          element={{
            ...item,
            segments: item.segments || segmentsMap?.[item.id],
          }}
          noteMap={new Map()}
          viewMode="full"
        />
      </div>
    );
  };

  // Render Group
  if (elementIds && elementIds.length > 0) {
    return (
      <NodeViewWrapper className="border-l-2 pl-3 py-2 my-4 select-none group relative">
        {/* Edit and Delete Buttons */}
        {/* The opaque background is functional: it keeps the floating icons legible over the text. */}
        <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-background flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => editor.storage.reference.onEdit?.(node, getPos)}
            title="Editar Vínculo"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:bg-destructive/10"
            onClick={() => {
              const pos = getPos();
              if (typeof pos === "number") {
                editor
                  .chain()
                  .deleteRange({ from: pos, to: pos + node.nodeSize })
                  .focus()
                  .run();
              }
            }}
            title="Excluir Vínculo"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        {fullDoc ? (
          <NormativeListHeader
            doc={fullDoc}
            showLink={false}
          />
        ) : (
          <div className="text-[11px] text-muted-foreground mb-2 flex justify-between">
            <span>{pageTitle || "Carregando..."}</span>
          </div>
        )}

        <div className="space-y-4">
          {groupData.length > 0 ? (
            processGapsUnified(groupData as any, fullDoc?.elements || []).map(
              (item: any, itemIdx: number) => (
                <div key={item.id || itemIdx}>{renderItemContent(item)}</div>
              ),
            )
          ) : (
            <span className="italic text-muted-foreground text-sm">
              Carregando conteúdo...
            </span>
          )}
        </div>
      </NodeViewWrapper>
    );
  }

  // Render Single (Legacy)
  return (
    <NodeViewWrapper className="border-l-2 pl-3 py-2 my-4 select-none group relative">
      <div className="text-[11px] text-muted-foreground mb-1 flex justify-between">
        <span>{pageTitle || data?.pageTitle || "Referência"}</span>
      </div>

      {/* Edit and Delete Buttons (Legacy support) */}
      {/* The opaque background is functional: it keeps the floating icons legible over the text. */}
      <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-background flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => editor.storage.reference.onEdit?.(node, getPos)}
          title="Editar Vínculo"
        >
          <Edit className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive hover:bg-destructive/10"
          onClick={() => {
            const pos = getPos();
            if (typeof pos === "number") {
              editor
                .chain()
                .deleteRange({ from: pos, to: pos + node.nodeSize })
                .focus()
                .run();
            }
          }}
          title="Excluir Vínculo"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      <div className="text-foreground/90 leading-relaxed font-serif text-justify">
        {data?.text ? (
          <div dangerouslySetInnerHTML={{ __html: data.text }} />
        ) : (
          <span className="italic text-muted-foreground">
            Carregando conteúdo...
          </span>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const ReferenceExtension = Node.create({
  name: "reference",
  group: "block",
  atom: true,

  addStorage() {
    return {
      onEdit: null,
    };
  },

  addAttributes() {
    return {
      pageId: { default: null },
      elementId: { default: null },
      elementIds: { default: null }, // Array of IDs
      groupedElements: { default: null }, // Preloaded content
      label: { default: null },
      text: { default: null }, // HTML content
      segmentsMap: { default: null }, // Map of segments per element
    };
  },

  parseHTML() {
    return [{ tag: "reference-node" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["reference-node", HTMLAttributes];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ReferenceComponent) as any;
  },
});
