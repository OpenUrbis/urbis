import React, { useEffect, useState, useMemo } from "react";
import { JSONContent } from "@tiptap/core";
import {
  OriginalNormativo,
  NormativeElementEntity,
} from "../../domain/entities";
import { AnnotatedTextSegment } from "../../domain/types";
import { pageService } from "../../services/page-service";
import { buildElementDepthMap, ElementRow } from "./NormativeDocumentRenderer";
import { Loader2 } from "lucide-react";
import {
  ViewMode,
  processElementsForConsolidated,
  isElementInactive,
} from "./ConsolidationLogic";
import { processGapsUnified } from "./GapLogic";
import {
  getSegmentBaseText,
  resolveSegmentsForRender,
} from "../../domain/segment-anchor";
import { NormativeListHeader } from "../common/NormativeListHeader";

interface ColetaneaRendererProps {
  content?: JSONContent;
  viewMode?: ViewMode;
}

type SegmentedElement = NormativeElementEntity & {
  segments?: AnnotatedTextSegment[];
};

/**
 * Re-anchors the segments marked on a reference node against the element's canonical
 * base text and hands them to `ElementContent`, which applies them over that same base
 * and composes them with the element's own `specialSituations.trechos`.
 */
export function withResolvedReferenceSegments(
  element: SegmentedElement,
  segments?: AnnotatedTextSegment[],
): SegmentedElement {
  if (!Array.isArray(segments) || segments.length === 0) return element;

  const resolvedSegments = resolveSegmentsForRender(
    getSegmentBaseText(element),
    segments,
  );
  if (resolvedSegments.length === 0) return element;

  return { ...element, segments: resolvedSegments };
}

export function ColetaneaRenderer({
  content,
  viewMode = "full",
}: ColetaneaRendererProps) {
  const [docs, setDocs] = useState<Record<string, OriginalNormativo>>({});
  const [loading, setLoading] = useState(false);

  const depthMaps = useMemo(() => {
    return Object.fromEntries(
      Object.entries(docs).map(([docId, doc]) => [
        docId,
        buildElementDepthMap(doc.elements),
      ]),
    ) as Record<string, Map<string, number>>;
  }, [docs]);

  // Extract refs and fetch docs
  useEffect(() => {
    if (!content) return;

    const refs = new Set<string>();
    const traverse = (node: JSONContent) => {
      if (node.type === "reference" && node.attrs?.pageId) {
        refs.add(node.attrs.pageId);
      }
      if (node.content) node.content.forEach(traverse);
    };
    traverse(content);

    if (refs.size > 0) {
      setLoading(true);
      Promise.all(Array.from(refs).map((id) => pageService.getById(id)))
        .then((pages) => {
          const docMap: Record<string, OriginalNormativo> = {};
          pages.forEach((p) => {
            if (p && p.type === "original_normativo" && p.entity) {
              const original = p.entity as OriginalNormativo;
              const resolvedName =
                original.name?.trim() ||
                original.title?.trim() ||
                p.title?.trim();
              docMap[p.id] = {
                ...original,
                name: resolvedName,
                title: resolvedName,
              };
            }
          });
          setDocs(docMap);
        })
        .finally(() => setLoading(false));
    }
  }, [content]);

  if (loading)
    return (
      <div className="p-6 flex justify-center">
        <Loader2 className="animate-spin h-6 w-6" />
      </div>
    );
  if (!content || !content.content) return null;

  return (
    <div className="space-y-5">
      {content.content.map((block, idx) => {
        let referenceNode: JSONContent | null = null;

        if (block.type === "reference") {
          referenceNode = block;
        } else if (
          block.type === "paragraph" &&
          block.content?.length === 1 &&
          block.content[0].type === "reference"
        ) {
          referenceNode = block.content[0];
        }

        if (referenceNode) {
          const { pageId, elementId, elementIds, segmentsMap } =
            referenceNode.attrs || {};
          const doc = docs[pageId];
          const elementDepthMap = depthMaps[pageId];
          if (doc) {
            // Handle Grouped Elements
            if (elementIds && elementIds.length > 0) {
              const selectedSet = new Set(elementIds);
              const selectedElements = doc.elements.filter((el) =>
                selectedSet.has(el.id),
              );

              // Use Unified Gap Logic comparing against full original document
              let elements = processGapsUnified(
                selectedElements,
                doc.elements,
              ) as any[];

              // Apply Consolidation Logic
              if (viewMode === "consolidated") {
                const entitiesOnly = elements.filter(
                  (e) => e.type !== "Gap",
                ) as NormativeElementEntity[];
                const consolidated =
                  processElementsForConsolidated(entitiesOnly);
                elements = processGapsUnified(consolidated, doc.elements);
              }

              if (elements && elements.length > 0) {
                // Construct note map for these elements
                const noteMap = new Map<string, string[]>();
                doc.elements.forEach((n) => {
                  if (n.type === "Nota" && n.noteData) {
                    n.noteData.forEach((nd) => {
                      noteMap.set(nd.targetElementId, [
                        ...(noteMap.get(nd.targetElementId) || []),
                        n.index || "",
                      ]);
                    });
                  }
                });

                return (
                  <div key={idx} className="relative group my-5 border-l pl-3">
                    <NormativeListHeader
                      doc={doc}
                      showLink={true}
                    />
                    <div className="pl-2 grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-x-6 relative items-start">
                      {elements.map((el, elIdx) => {
                        if (el.type === "Gap") {
                          if (elIdx === 0 || elIdx === elements.length - 1) {
                            // If gap is at the start or end, we can indicate it's a continuation with "..."
                            return;
                          }
                          return (
                            <div
                              key={el.id || elIdx}
                              className="col-start-1 text-muted-foreground my-2 font-mono text-sm tracking-widest pl-8"
                            >
                              [...]
                            </div>
                          );
                        }

                        // Segments marked on the reference: segmentsMap (multi-element)
                        // first, then the legacy single-element attribute.
                        const referenceSegments =
                          segmentsMap?.[el.id] ??
                          (elementId === el.id
                            ? referenceNode?.attrs?.segments
                            : undefined);
                        const displayElement = withResolvedReferenceSegments(
                          el,
                          referenceSegments,
                        );

                        return (
                          <ElementRow
                            key={el.id}
                            element={displayElement}
                            noteMap={noteMap}
                            viewMode={viewMode}
                            indentationLevel={elementDepthMap?.get(el.id) ?? 0}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              }
            }
            // Handle Single Element (Legacy)
            else if (elementId && elementId !== "root") {
              const el = doc.elements?.find((e) => e.id === elementId);

              // Check visibility for Consolidated Mode
              const isVisible = viewMode === "full" || !isElementInactive(el!);

              if (el && isVisible) {
                const noteMap = new Map<string, string[]>();
                doc.elements.forEach((n) => {
                  if (n.type === "Nota" && n.noteData) {
                    n.noteData.forEach((nd) => {
                      if (nd.targetElementId === el.id) {
                        noteMap.set(el.id, [
                          ...(noteMap.get(el.id) || []),
                          n.index || "",
                        ]);
                      }
                    });
                  }
                });

                return (
                  <div key={idx} className="relative group border-l pl-3">
                    <NormativeListHeader
                      doc={doc}
                      showLink={true}
                    />
                    <div className="pl-2 grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-x-6 relative items-start">
                      <ElementRow
                        element={withResolvedReferenceSegments(
                          el,
                          segmentsMap?.[el.id] ??
                            referenceNode?.attrs?.segments,
                        )}
                        noteMap={noteMap}
                        viewMode={viewMode}
                        indentationLevel={elementDepthMap?.get(el.id) ?? 0}
                      />
                    </div>
                  </div>
                );
              } else if (el && viewMode === "consolidated") {
                // If inactive and consolidated, maybe show separator or nothing?
                // Requirement: "No caso de apenas partes inativas, devem ser inseridas em seu lugar separações '[...]' em linha."
                // If the WHOLE element is referenced but inactive, we probably show [...]
                return (
                  <div
                    key={idx}
                    className="text-center text-muted-foreground my-4 font-mono text-sm tracking-widest"
                  >
                    [...]
                  </div>
                );
              }
            } else {
              // Root link
              return (
                <div key={idx} className="border-l pl-3 my-4">
                  <NormativeListHeader doc={doc} showLink={true} />
                </div>
              );
            }
          }
        }

        // Simple Text Renderer Fallback
        if (block.type === "paragraph" || block.type === "heading") {
          const text = block.content?.map((c) => c.text).join("") || "";
          if (!text.trim()) return <br key={idx} />; // spacer

          const Content = () => {
            if (block.type === "heading") {
              const Tag =
                `h${block.attrs?.level || 2}` as keyof JSX.IntrinsicElements;
              return <Tag className="font-bold mt-4 mb-2">{text}</Tag>;
            }
            return <p className="mb-2 text-justify">{text}</p>;
          };

          return (
            <div
              key={idx}
              className="pl-2 grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-x-6 relative items-start"
            >
              <div className="col-start-1 pr-4 xl:pr-8">
                <Content />
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
