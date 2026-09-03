import type { AnnotatedTextSegment, NormativeElement } from "./types";
import { getElementKey } from "./display-logic";
import {
  getCleanDisplayText,
  htmlToPlainText,
  normalizeAnnotatedTextSegments,
  parseToWordIndex,
  stripRedundantLeadingKey,
} from "./text-utils";

/**
 * Single source of truth for text-segment ("trecho") offsets.
 *
 * Historically each consumer measured `start`/`end` against a different text:
 * the raw HTML, the HTML-stripped DOM of a modal, or the plain text produced by
 * `htmlToPlainText` (which injects "\n" and "• "). Offsets therefore drifted and
 * segments silently pointed at the wrong characters.
 *
 * Everything now measures against `getSegmentBaseText`, and every segment also
 * stores a redundant textual anchor so it can be re-located when the underlying
 * text changes.
 */

/** Characters of surrounding context stored alongside each segment. */
export const SEGMENT_ANCHOR_CONTEXT_LENGTH = 24;

export type SegmentResolutionStatus =
  /** Offsets matched the stored text exactly. */
  | "exact"
  /** Offsets were stale but the segment was re-located by its text. */
  | "reanchored"
  /** No stored text to verify against; offsets were kept as-is. */
  | "unverified"
  /** The segment text no longer exists in the base text. */
  | "lost";

export interface ResolvedSegment extends AnnotatedTextSegment {
  status: SegmentResolutionStatus;
  /** Offsets as persisted, before resolution. */
  originalStart: number;
  originalEnd: number;
}

export interface SegmentResolution {
  segments: ResolvedSegment[];
  /** Segments whose offsets had to be corrected. */
  drifted: ResolvedSegment[];
  /** Segments that could not be located at all. */
  lost: ResolvedSegment[];
}

type ElementTextSource = Pick<NormativeElement, "text" | "type" | "index">;

/**
 * The canonical text a segment's `start`/`end` refer to.
 *
 * Mirrors exactly what `NormativeDocumentRenderer` renders:
 * `stripRedundantLeadingKey(getCleanDisplayText(...), key)` piped through
 * `htmlToPlainText` (which `applyAnnotatedSegmentsToText` also applies
 * internally).
 */
export function getSegmentBaseText(element?: ElementTextSource | null): string {
  if (!element || typeof element.text !== "string" || !element.text) return "";

  const key = getElementKey({
    type: element.type,
    index: element.index,
    text: element.text,
  } as NormativeElement);

  const cleaned = stripRedundantLeadingKey(
    getCleanDisplayText(element.text, element.type, element.index),
    key,
  );

  return htmlToPlainText(cleaned).trim();
}

/* -------------------------------------------------------------------------- */
/* Whitespace-insensitive matching                                             */
/* -------------------------------------------------------------------------- */

interface NormalizedText {
  /** Whitespace runs collapsed to a single space. */
  text: string;
  /** `map[i]` is the index in the source string of normalized character `i`. */
  map: number[];
}

/**
 * Collapses whitespace runs so a segment survives the "\n"/"• "/nbsp
 * differences between the several text pipelines, while keeping a way back to
 * the original offsets.
 */
function normalizeForMatch(text: string): NormalizedText {
  const chars: string[] = [];
  const map: number[] = [];
  let previousWasWhitespace = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (/\s/.test(char)) {
      if (previousWasWhitespace) continue;
      chars.push(" ");
      map.push(index);
      previousWasWhitespace = true;
      continue;
    }

    chars.push(char);
    map.push(index);
    previousWasWhitespace = false;
  }

  return { text: chars.join(""), map };
}

function toSourceRange(
  normalized: NormalizedText,
  normalizedStart: number,
  normalizedLength: number,
): { start: number; end: number } | null {
  if (normalizedLength <= 0) return null;

  const start = normalized.map[normalizedStart];
  const lastIndex = normalizedStart + normalizedLength - 1;
  const lastSourceIndex = normalized.map[lastIndex];

  if (start === undefined || lastSourceIndex === undefined) return null;

  return { start, end: lastSourceIndex + 1 };
}

function collectOccurrences(haystack: string, needle: string): number[] {
  if (!needle) return [];

  const positions: number[] = [];
  let cursor = haystack.indexOf(needle);

  while (cursor !== -1) {
    positions.push(cursor);
    cursor = haystack.indexOf(needle, cursor + 1);
  }

  return positions;
}

/**
 * Finds `needle` inside `baseText`, tolerating whitespace differences.
 *
 * When the text occurs more than once, `hintOffset` (an approximate position in
 * `baseText`) breaks the tie — this is what makes capturing a selection from the
 * editor unambiguous even for repeated wording.
 */
export function locateTextInBase(
  baseText: string,
  needle: string,
  hintOffset?: number,
): { start: number; end: number } | null {
  const trimmedNeedle = needle?.trim();
  if (!baseText || !trimmedNeedle) return null;

  const normalizedBase = normalizeForMatch(baseText);
  const normalizedNeedle = normalizeForMatch(trimmedNeedle).text;
  if (!normalizedNeedle) return null;

  const pickClosest = (positions: number[]) => {
    if (!positions.length) return null;
    if (positions.length === 1 || hintOffset === undefined) return positions[0];

    // `hintOffset` is a source offset; compare in normalized space.
    let normalizedHint = normalizedBase.map.findIndex(
      (sourceIndex) => sourceIndex >= hintOffset,
    );
    if (normalizedHint === -1) normalizedHint = normalizedBase.text.length;

    return positions.reduce(
      (best, position) =>
        Math.abs(position - normalizedHint) < Math.abs(best - normalizedHint)
          ? position
          : best,
      positions[0],
    );
  };

  const caseSensitive = pickClosest(
    collectOccurrences(normalizedBase.text, normalizedNeedle),
  );
  if (caseSensitive !== null) {
    return toSourceRange(
      normalizedBase,
      caseSensitive,
      normalizedNeedle.length,
    );
  }

  const caseInsensitive = pickClosest(
    collectOccurrences(
      normalizedBase.text.toLowerCase(),
      normalizedNeedle.toLowerCase(),
    ),
  );
  if (caseInsensitive !== null) {
    return toSourceRange(
      normalizedBase,
      caseInsensitive,
      normalizedNeedle.length,
    );
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* Anchors                                                                     */
/* -------------------------------------------------------------------------- */

export function buildSegmentAnchor(
  baseText: string,
  start: number,
  end: number,
): { anchorBefore?: string; anchorAfter?: string } {
  if (!baseText) return {};

  const before = baseText.slice(
    Math.max(0, start - SEGMENT_ANCHOR_CONTEXT_LENGTH),
    start,
  );
  const after = baseText.slice(end, end + SEGMENT_ANCHOR_CONTEXT_LENGTH);

  return {
    anchorBefore: before || undefined,
    anchorAfter: after || undefined,
  };
}

/**
 * Stamps a segment with the redundant data needed to survive text edits:
 * the selected text plus surrounding context.
 */
export function withSegmentAnchor(
  baseText: string,
  segment: AnnotatedTextSegment,
): AnnotatedTextSegment {
  const selectedText = baseText.slice(segment.start, segment.end);

  return {
    ...segment,
    selectedText: selectedText.trim() || segment.selectedText,
    ...buildSegmentAnchor(baseText, segment.start, segment.end),
  };
}

function textsMatch(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  return normalizeForMatch(a.trim()).text === normalizeForMatch(b.trim()).text;
}

function scoreContext(
  baseText: string,
  start: number,
  end: number,
  segment: AnnotatedTextSegment,
): number {
  const { anchorBefore, anchorAfter } = buildSegmentAnchor(
    baseText,
    start,
    end,
  );
  let score = 0;
  if (
    segment.anchorBefore &&
    anchorBefore?.endsWith(segment.anchorBefore.slice(-8))
  )
    score += 1;
  if (
    segment.anchorAfter &&
    anchorAfter?.startsWith(segment.anchorAfter.slice(0, 8))
  )
    score += 1;
  return score;
}

/**
 * Re-anchors persisted segments against the current base text.
 *
 * This is what stops a segment from silently pointing at the wrong characters
 * after the element's text is edited (which happens on every keystroke, since
 * `PageForm`'s update handler reserializes the element text).
 */
export function resolveSegments(
  baseText: string,
  segments?: AnnotatedTextSegment[],
): SegmentResolution {
  const normalized = normalizeAnnotatedTextSegments(segments);

  const resolved = normalized.map<ResolvedSegment>((segment) => {
    const originalStart = segment.start;
    const originalEnd = segment.end;
    const base = { ...segment, originalStart, originalEnd };

    if (!baseText) {
      return { ...base, status: "unverified" };
    }

    const referenceText =
      segment.selectedText ??
      (segment.type !== "supplement" ? segment.text : undefined);

    if (!referenceText?.trim()) {
      // Nothing to verify against: clamp and keep.
      const start = Math.min(segment.start, baseText.length);
      const end = Math.min(Math.max(segment.end, start), baseText.length);
      return {
        ...base,
        start,
        end,
        status: end > start ? "unverified" : "lost",
      };
    }

    const currentSlice = baseText.slice(segment.start, segment.end);
    if (textsMatch(currentSlice, referenceText)) {
      return { ...base, status: "exact" };
    }

    const located = locateTextInBase(baseText, referenceText, segment.start);
    if (!located) {
      return { ...base, status: "lost" };
    }

    // Prefer an occurrence whose surrounding context also matches.
    const contextScore = scoreContext(
      baseText,
      located.start,
      located.end,
      segment,
    );
    const anchoredAlternative =
      contextScore === 0 && segment.anchorBefore
        ? locateTextInBase(
            baseText,
            `${segment.anchorBefore}${referenceText}`,
            segment.start,
          )
        : null;

    const finalRange = anchoredAlternative
      ? {
          start: anchoredAlternative.end - located.end + located.start,
          end: anchoredAlternative.end,
        }
      : located;

    return {
      ...base,
      start: finalRange.start,
      end: finalRange.end,
      status: "reanchored",
    };
  });

  return {
    segments: resolved,
    drifted: resolved.filter((segment) => segment.status === "reanchored"),
    lost: resolved.filter((segment) => segment.status === "lost"),
  };
}

/** Drops unresolvable segments and returns plain segments with corrected offsets. */
export function resolveSegmentsForRender(
  baseText: string,
  segments?: AnnotatedTextSegment[],
): AnnotatedTextSegment[] {
  return resolveSegments(baseText, segments)
    .segments.filter((segment) => segment.status !== "lost")
    .map(({ status, originalStart, originalEnd, ...segment }) => segment);
}

/* -------------------------------------------------------------------------- */
/* Word-boundary helpers                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Expands a raw character range to whole words, so a slightly imprecise mouse
 * selection never cuts a word in half.
 */
export function snapRangeToWordBoundaries(
  baseText: string,
  start: number,
  end: number,
): { start: number; end: number } {
  const words = parseToWordIndex(baseText);
  if (!words.length) return { start, end };

  const clampedStart = Math.max(0, Math.min(start, baseText.length));
  const clampedEnd = Math.max(clampedStart, Math.min(end, baseText.length));

  const overlapped = words.filter(
    (word) =>
      (word.startIndex >= clampedStart && word.startIndex < clampedEnd) ||
      (word.endIndex > clampedStart && word.endIndex <= clampedEnd) ||
      (word.startIndex <= clampedStart && word.endIndex >= clampedEnd),
  );

  if (!overlapped.length) return { start: clampedStart, end: clampedEnd };

  return {
    start: overlapped[0].startIndex,
    end: overlapped[overlapped.length - 1].endIndex,
  };
}

export type SegmentEdge = "start" | "end";
export type SegmentEdgeDirection = "expand" | "shrink";

/**
 * Moves one edge of a segment by a whole word. This is the "ajustar trecho"
 * affordance: adjusting a marked passage without re-selecting it from scratch.
 */
export function adjustSegmentEdgeByWord(
  baseText: string,
  segment: AnnotatedTextSegment,
  edge: SegmentEdge,
  direction: SegmentEdgeDirection,
): AnnotatedTextSegment {
  const words = parseToWordIndex(baseText);
  if (!words.length) return segment;

  let { start, end } = segment;

  if (edge === "start") {
    if (direction === "expand") {
      const previous = [...words]
        .reverse()
        .find((word) => word.endIndex <= start);
      if (previous) start = previous.startIndex;
    } else {
      const next = words.find(
        (word) => word.startIndex > start && word.endIndex <= end,
      );
      if (next) start = next.startIndex;
    }
  } else if (direction === "expand") {
    const next = words.find((word) => word.startIndex >= end);
    if (next) end = next.endIndex;
  } else {
    const previous = [...words]
      .reverse()
      .find((word) => word.endIndex < end && word.startIndex >= start);
    if (previous) end = previous.endIndex;
  }

  if (end <= start) return segment;

  return withSegmentAnchor(baseText, { ...segment, start, end });
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                  */
/* -------------------------------------------------------------------------- */

export interface SegmentOverlap {
  firstIndex: number;
  secondIndex: number;
}

export function findSegmentOverlaps(
  segments: AnnotatedTextSegment[],
): SegmentOverlap[] {
  const overlaps: SegmentOverlap[] = [];

  for (let i = 0; i < segments.length; i += 1) {
    for (let j = i + 1; j < segments.length; j += 1) {
      const a = segments[i];
      const b = segments[j];
      if (a.start < b.end && b.start < a.end) {
        overlaps.push({ firstIndex: i, secondIndex: j });
      }
    }
  }

  return overlaps;
}

/** Merges overlapping/adjacent segments of the same type. */
export function mergeOverlappingSegments(
  baseText: string,
  segments: AnnotatedTextSegment[],
): AnnotatedTextSegment[] {
  const sorted = [...segments].sort(
    (a, b) => a.start - b.start || a.end - b.end,
  );
  const merged: AnnotatedTextSegment[] = [];

  sorted.forEach((segment) => {
    const previous = merged[merged.length - 1];

    if (
      previous &&
      previous.type === segment.type &&
      segment.start <= previous.end
    ) {
      const end = Math.max(previous.end, segment.end);
      merged[merged.length - 1] = withSegmentAnchor(baseText, {
        ...previous,
        end,
        supplementText: previous.supplementText ?? segment.supplementText,
      });
      return;
    }

    merged.push(segment);
  });

  return merged;
}

export function isSegmentValid(segment: AnnotatedTextSegment): boolean {
  if (segment.end <= segment.start) return false;
  if (segment.type === "supplement" && !segment.supplementText?.trim())
    return false;
  return true;
}
