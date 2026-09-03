import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { getCleanDisplayText } from "../../domain/text-utils";
import { locateTextInBase } from "../../domain/segment-anchor";

/**
 * Maps between ProseMirror document positions and offsets in an element's
 * canonical base text (see `domain/segment-anchor.ts`).
 *
 * This is what lets a passage ("trecho") be marked by selecting text directly in
 * the editor: the offsets are derived from the document itself instead of being
 * measured on a duplicated DOM inside a modal.
 */

export type VisibleTextFragment = {
  absoluteFrom: number;
  absoluteTo: number;
  rawStart: number;
  rawEnd: number;
};

export type NormativeNodeAttrs = Record<string, unknown> & {
  type?: string;
  index?: string | number | null;
  specialSituations?: unknown;
  normativeId?: unknown;
};

/**
 * Walks a block node collecting its visible text plus, for every text run, the
 * absolute document positions it occupies.
 */
export function getNodeVisibleTextFragments(
  node: ProseMirrorNode,
  nodePos: number,
) {
  const fragments: VisibleTextFragment[] = [];
  let visibleText = "";
  let rawCharIndex = 0;

  node.descendants((child, pos) => {
    if (child.isText) {
      const textContent = child.text ?? "";

      if (!textContent.length) {
        return false;
      }

      const absoluteFrom = nodePos + pos + 1;
      const rawStart = rawCharIndex;
      const rawEnd = rawStart + textContent.length;

      fragments.push({
        absoluteFrom,
        absoluteTo: absoluteFrom + textContent.length,
        rawStart,
        rawEnd,
      });

      visibleText += textContent;
      rawCharIndex = rawEnd;
      return false;
    }

    if (child.type.name === "hardBreak") {
      const absoluteFrom = nodePos + pos + 1;
      const rawStart = rawCharIndex;
      const rawEnd = rawStart + 1;

      fragments.push({
        absoluteFrom,
        absoluteTo: absoluteFrom + 1,
        rawStart,
        rawEnd,
      });

      visibleText += "\n";
      rawCharIndex = rawEnd;
      return false;
    }

    return true;
  });

  return { fragments, visibleText };
}

export function getNodeDisplayContext(attrs?: NormativeNodeAttrs) {
  const type = typeof attrs?.type === "string" ? attrs.type : "";
  const index = attrs?.index;

  return {
    type,
    index:
      typeof index === "string" || typeof index === "number"
        ? String(index)
        : undefined,
  };
}

/**
 * How many characters of the node's visible text belong to the normative prefix
 * ("Art. 1º - "), which the canonical base text does not include.
 */
export function getCleanDisplayOffset(
  visibleText: string,
  attrs?: NormativeNodeAttrs,
) {
  if (!visibleText) {
    return 0;
  }

  const { type, index } = getNodeDisplayContext(attrs);

  if (!type) {
    return 0;
  }

  const cleanDisplayText = getCleanDisplayText(visibleText, type, index);

  if (!cleanDisplayText) {
    return 0;
  }

  const directOffset = visibleText.indexOf(cleanDisplayText);

  return directOffset >= 0 ? directOffset : 0;
}

export interface NodeTextMapping {
  fragments: VisibleTextFragment[];
  visibleText: string;
  /** Offset of the canonical base text inside `visibleText`. */
  baseOffset: number;
}

/**
 * Aligns the canonical base text inside the node's visible text by content.
 *
 * Deriving the prefix length from `attrs.type`/`attrs.index` is unreliable:
 * `performSync` only writes `normativeId` back into the node attributes, so a
 * freshly structured node has no `type`, `getCleanDisplayOffset` returns 0, and
 * every decoration ends up shifted by the length of "Art. 1º - ".
 *
 * Matching the beginning of the base text against the visible text avoids the
 * whole problem, and tolerates the whitespace differences introduced by
 * `htmlToPlainText`.
 */
export function resolveBaseOffsetByContent(
  visibleText: string,
  baseText?: string,
): number | null {
  const trimmedBase = baseText?.trim();
  if (!visibleText || !trimmedBase) return null;

  // A short probe is enough to find where the base starts, and is cheaper and
  // more robust than matching the whole text (which may have been edited).
  const probe = trimmedBase.slice(0, 48);
  const located = locateTextInBase(visibleText, probe, 0);

  return located ? located.start : null;
}

export function getNodeTextMapping(
  node: ProseMirrorNode,
  nodePos: number,
  attrs?: NormativeNodeAttrs,
  baseText?: string,
): NodeTextMapping {
  const { fragments, visibleText } = getNodeVisibleTextFragments(node, nodePos);

  const byContent = resolveBaseOffsetByContent(visibleText, baseText);

  return {
    fragments,
    visibleText,
    baseOffset: byContent ?? getCleanDisplayOffset(visibleText, attrs),
  };
}

/**
 * Locates a passage in the node by its stored text, falling back to arithmetic
 * offsets. Text is the reliable anchor: offsets drift whenever the element text
 * is edited, and the editor reserializes it on every keystroke.
 */
export function locateSegmentInNode(
  mapping: NodeTextMapping,
  segment: { start: number; end: number; selectedText?: string },
): { from: number; to: number }[] {
  const selectedText = segment.selectedText?.trim();

  if (selectedText) {
    const hint = segment.start + mapping.baseOffset;
    const located = locateTextInBase(mapping.visibleText, selectedText, hint);

    if (located) {
      return rawRangeToDocRanges(mapping, located.start, located.end);
    }
  }

  return baseRangeToDocRanges(mapping, segment.start, segment.end);
}

/** Maps a range measured in `visibleText` to document ranges. */
export function rawRangeToDocRanges(
  mapping: NodeTextMapping,
  rawStart: number,
  rawEnd: number,
): { from: number; to: number }[] {
  if (rawEnd <= rawStart) return [];

  const ranges: { from: number; to: number }[] = [];

  mapping.fragments.forEach((fragment) => {
    const fromChar = Math.max(rawStart, fragment.rawStart);
    const toChar = Math.min(rawEnd, fragment.rawEnd);

    if (toChar <= fromChar) return;

    ranges.push({
      from: fragment.absoluteFrom + (fromChar - fragment.rawStart),
      to: fragment.absoluteFrom + (toChar - fragment.rawStart),
    });
  });

  return ranges;
}

/**
 * Converts a range in the canonical base text into the document ranges that
 * cover it. A single range can span several fragments when the text is split by
 * marks (bold, italic) or hard breaks.
 */
export function baseRangeToDocRanges(
  mapping: NodeTextMapping,
  start: number,
  end: number,
): { from: number; to: number }[] {
  return rawRangeToDocRanges(
    mapping,
    start + mapping.baseOffset,
    end + mapping.baseOffset,
  );
}

/**
 * Converts a document position into an offset in the canonical base text.
 * Returns `null` when the position falls outside the node's text.
 */
export function docPosToBaseOffset(
  mapping: NodeTextMapping,
  pos: number,
): number | null {
  for (const fragment of mapping.fragments) {
    if (pos >= fragment.absoluteFrom && pos <= fragment.absoluteTo) {
      const raw = fragment.rawStart + (pos - fragment.absoluteFrom);
      return Math.max(0, raw - mapping.baseOffset);
    }
  }

  return null;
}
