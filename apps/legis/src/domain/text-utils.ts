import type { AnnotatedTextSegment } from "./types";

type AnnotatedTextSegmentInput =
  | AnnotatedTextSegment
  | {
      start: number;
      end: number;
      text?: string;
      type?: "omission" | "supplement";
      supplementText?: string;
      selectedText?: string;
      omissionPlaceholder?: string;
      anchorBefore?: string;
      anchorAfter?: string;
    };

export interface WordIndex {
  word: string;
  startIndex: number;
  endIndex: number;
  index: number;
}

/**
 * Parses text into a list of words with their character positions.
 * Uses spaces and newlines as delimiters.
 */
export function parseToWordIndex(text: string): WordIndex[] {
  if (!text) return [];

  const words: WordIndex[] = [];
  // Regex to match words (non-whitespace sequences)
  // We want to capture the word and its position
  // \S+ matches non-whitespace characters
  const regex = /\S+/g;
  let match;
  let index = 0; // 1-based index as per example? Example starts at 1 ("Art." is 1).

  // Actually, usually indices are 0-based in code, but example showed 1-based in table (1 Art. 0).
  // But then "index 22" was used.
  // Let's stick to 0-based for internal logic, and display/use as needed.
  // Example: "Art." is index 0.

  while ((match = regex.exec(text)) !== null) {
    words.push({
      word: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      index: index++,
    });
  }

  return words;
}

/**
 * Calculates start and end WORD indices from a character selection range.
 */
export function getWordIndicesFromSelection(
  text: string,
  startChar: number,
  endChar: number,
): { startWordIndex: number; endWordIndex: number } | null {
  const words = parseToWordIndex(text);
  if (words.length === 0) return null;

  // Find word that contains startChar or is nearest after?
  // User selects range. The selection might start in the middle of a word.
  // "Correções triviais... alterariam o resultado".
  // We should include the word if it's partially selected? Or only if fully?
  // Usually "expand to word boundaries".

  // Logic: find word that overlaps with [startChar, endChar).

  const overlapped = words.filter(
    (w) =>
      (w.startIndex >= startChar && w.startIndex < endChar) || // Starts inside
      (w.endIndex > startChar && w.endIndex <= endChar) || // Ends inside
      (w.startIndex <= startChar && w.endIndex >= endChar), // Encloses
  );

  if (overlapped.length === 0) return null;

  const first = overlapped[0];
  const last = overlapped[overlapped.length - 1];

  return {
    startWordIndex: first.index,
    endWordIndex: last.index,
  };
}

/**
 * Reconstructs text from word indices, adding [...] if needed.
 */
export function extractTextFromWordIndices(
  text: string,
  startWordIdx: number,
  endWordIdx: number,
  stripQuotes: boolean = false,
): string {
  const words = parseToWordIndex(text);
  if (words.length === 0) return "";

  // Validate indices
  if (
    startWordIdx < 0 ||
    startWordIdx >= words.length ||
    endWordIdx < startWordIdx
  )
    return "";

  // Get range of words
  const startWord = words[startWordIdx];
  const endWord =
    words[endWordIdx >= words.length ? words.length - 1 : endWordIdx];

  // Extract raw substring
  let extracted = text.substring(startWord.startIndex, endWord.endIndex);

  // Strip quotes logic (for Ementa)
  if (stripQuotes) {
    // Check start
    const quoteChars = /^["'“‘«‹„‚`]/;
    if (quoteChars.test(extracted)) {
      extracted = extracted.replace(quoteChars, "");
    }
    // Check end
    const endQuoteChars = /["'”’»›]$/;
    if (endQuoteChars.test(extracted)) {
      extracted = extracted.replace(endQuoteChars, "");
    }
  }

  // Add prefix/suffix [...]
  const prefix = startWordIdx > 0 ? "[...] " : "";
  const suffix = endWordIdx < words.length - 1 ? " [...]" : "";

  return `${prefix}${extracted}${suffix}`;
}

/**
 * Normalizes ordinals variations to "º".
 */
export function normalizeOrdinals(text: string): string {
  if (!text) return text;
  // Variations: “º”, “°”, “ᵒ”, “∘”, “o” preceded or not by dot
  // Must be preceded by a number to avoid false positives (e.g. "saneamento")
  return text.replace(/(\d+)\.?\s*(º|°|ᵒ|∘|o)(?=\s|\.|$)/g, "$1º");
}

/**
 * Strip quotes and similar symbols from start and end of string.
 */
export function stripQuotes(text: string): string {
  if (!text) return text;
  // variations: “, ”, ‘, ’, «, », ‹, ›, „, ‚, ", ', `
  // More precise strip:
  let result = text.trim();
  const startQuote = /^[“‘’«»‹›„‚"'`]/;
  const endQuote = /[“‘’«»‹›„‚"'`]$/;

  while (startQuote.test(result)) {
    result = result.substring(1).trim();
  }
  while (endQuote.test(result)) {
    result = result.substring(0, result.length - 1).trim();
  }
  return result;
}

function buildFlexibleNumericIndexPattern(index: string): string {
  const trimmedIndex = index.trim();

  if (/^\d+(?:\.[A-Za-z0-9]+)+\.?$/.test(trimmedIndex)) {
    const segments = trimmedIndex.replace(/\.$/, "").split(".").filter(Boolean);
    return `${segments.map(escapeRegex).join("\\s*\\.\\s*")}\\.?`;
  }

  const normalized = trimmedIndex.replace(/[.\s]/g, "");
  const ordinalSuffix = /[º°oᵒ∘ª]$/.test(normalized) ? "[º°oᵒ∘ª]?" : "";
  const digitsOnly = normalized.replace(/[º°oᵒ∘ª]/g, "");

  if (/^\d+$/.test(digitsOnly)) {
    const grouped = digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const escapedGrouped = grouped.replace(/\./g, "\\.?");
    return `${escapedGrouped}${ordinalSuffix}`;
  }

  return trimmedIndex
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/[º°oᵒ∘ª]/g, "[º°oᵒ∘ª]?");
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function decodeBasicHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function formatPlainTextAsHtml(text: string): string {
  return escapeHtml(text).replace(/\n/g, "<br />");
}

function getSegmentNote(segment: AnnotatedTextSegment): string | undefined {
  const raw =
    segment.supplementText ??
    (segment.type === "supplement" ? segment.text : undefined);
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

export function htmlToPlainText(text: string): string {
  if (!text) return "";

  const withLineBreaks = text
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*\/p\s*>/gi, "\n")
    .replace(/<\s*\/div\s*>/gi, "\n")
    .replace(/<\s*li\b[^>]*>/gi, "• ")
    .replace(/<\s*\/li\s*>/gi, "\n");

  // Tags are stripped BEFORE entities are decoded: decoding first would turn a
  // literal "&lt;" into "<" and the tag-stripping pass would then swallow real
  // content (e.g. "Se x &lt; 3 e y &gt; 4" became "Se x  4").
  return decodeBasicHtmlEntities(withLineBreaks.replace(/<[^>]+>/g, ""))
    .replace(/\u00A0/g, " ")
    .replace(/\n{3,}/g, "\n\n");
}

export function normalizeAnnotatedTextSegments(
  segments?: AnnotatedTextSegmentInput[],
): AnnotatedTextSegment[] {
  if (!segments?.length) return [];

  const unique = new Map<string, AnnotatedTextSegment>();

  segments.forEach((segment) => {
    if (!segment) return;

    const start = Number(segment.start);
    const end = Number(segment.end);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return;

    const normalizedStart = Math.max(0, Math.floor(start));
    const normalizedEnd = Math.max(normalizedStart, Math.floor(end));
    if (normalizedEnd <= normalizedStart) return;

    const type = segment.type ?? "omission";
    const selectedText = (
      segment.selectedText ?? (type !== "supplement" ? segment.text : undefined)
    )?.trim();
    const supplementText = (
      segment.supplementText ??
      (type === "supplement" ? segment.text : undefined)
    )?.trim();
    const omissionPlaceholder = segment.omissionPlaceholder?.trim();
    const legacyText =
      (type === "supplement" ? supplementText : selectedText) ??
      segment.text?.trim();

    const normalizedSegment: AnnotatedTextSegment = {
      start: normalizedStart,
      end: normalizedEnd,
      type,
      selectedText: selectedText || undefined,
      supplementText: supplementText || undefined,
      omissionPlaceholder: omissionPlaceholder || undefined,
      anchorBefore: segment.anchorBefore || undefined,
      anchorAfter: segment.anchorAfter || undefined,
      text: legacyText || undefined,
    };

    const key = [
      normalizedSegment.start,
      normalizedSegment.end,
      normalizedSegment.type,
      normalizedSegment.selectedText ?? "",
      normalizedSegment.supplementText ?? "",
      normalizedSegment.omissionPlaceholder ?? "",
    ].join(":");

    unique.set(key, normalizedSegment);
  });

  return Array.from(unique.values()).sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return a.end - b.end;
  });
}

export function buildAnnotatedSegmentsExcerpt(
  segments?: AnnotatedTextSegmentInput[],
): string {
  const normalizedSegments = normalizeAnnotatedTextSegments(segments);

  return normalizedSegments
    .map((segment) => {
      const selectedText = segment.selectedText?.trim() || "Trecho selecionado";
      const note = getSegmentNote(segment);

      if (segment.type === "supplement" && note) {
        return `${selectedText} [${note}]`;
      }

      return selectedText;
    })
    .join(" [...] ");
}

export interface ApplyAnnotatedSegmentsOptions {
  /**
   * Set when `text` is already the canonical plain-text base (see
   * `domain/segment-anchor.ts`). Skips the internal `htmlToPlainText` pass,
   * which is not idempotent for double-encoded entities ("&amp;nbsp;" would be
   * decoded a second time, shifting every offset after it).
   */
  preformatted?: boolean;
}

/**
 * Builds a citation that KEEPS the marked passages and elides everything around
 * them, which is the inverse of `applyAnnotatedSegmentsToText`.
 *
 * This is how a source act is quoted: of a veto message holding several
 * provisions, only the relevant fragment is reproduced, with "[...]" standing for
 * the surrounding text.
 *
 *   full text      → "Ficam vetados os arts. 3º e 4º do projeto."
 *   marked "3º e 4º" → "[...] 3º e 4º [...]"
 *
 * With no passages the whole text is the citation.
 */
export function buildRetainedExcerpt(
  baseText: string,
  segments?: AnnotatedTextSegmentInput[],
  ellipsis: string = "[...]",
): string {
  const text = baseText?.trim() ?? "";
  if (!text) return "";

  const normalizedSegments = normalizeAnnotatedTextSegments(segments);
  if (!normalizedSegments.length) return text;

  const parts: string[] = [];
  let cursor = 0;

  normalizedSegments.forEach((segment) => {
    const start = Math.min(Math.max(segment.start, 0), text.length);
    const end = Math.min(Math.max(segment.end, start), text.length);
    if (end <= start) return;

    // Elide only when text is actually being dropped, so a passage starting at
    // the beginning does not get a leading "[...]".
    if (text.slice(cursor, start).trim()) parts.push(ellipsis);

    const retained = text.slice(start, end).trim();
    if (retained) parts.push(retained);

    const note = getSegmentNote(segment);
    if (segment.type === "supplement" && note) parts.push(`[${note}]`);

    cursor = end;
  });

  if (!parts.length) return text;
  if (text.slice(cursor).trim()) parts.push(ellipsis);

  return parts.join(" ");
}

/**
 * Rebuilds a citation from anchored passages alone, for contexts where the source
 * text is not at hand (the reading view has no access to the other document).
 *
 * Uses the redundant anchors written by `withSegmentAnchor`: `start > 0` or a
 * non-empty `anchorBefore` means text was dropped on the left, and a non-empty
 * `anchorAfter` means text was dropped on the right.
 */
export function buildCitationFromAnchoredSegments(
  segments?: AnnotatedTextSegmentInput[],
  ellipsis: string = "[...]",
): string | undefined {
  const normalizedSegments = normalizeAnnotatedTextSegments(segments);
  if (!normalizedSegments.length) return undefined;

  const parts: string[] = [];
  const first = normalizedSegments[0];
  const last = normalizedSegments[normalizedSegments.length - 1];

  if (first.start > 0 || first.anchorBefore?.trim()) parts.push(ellipsis);

  normalizedSegments.forEach((segment, index) => {
    if (index > 0) parts.push(ellipsis);

    const retained = segment.selectedText?.trim();
    if (retained) parts.push(retained);

    const note = getSegmentNote(segment);
    if (segment.type === "supplement" && note) parts.push(`[${note}]`);
  });

  if (last.anchorAfter?.trim()) parts.push(ellipsis);

  const citation = parts.join(" ").trim();
  return citation === ellipsis ? undefined : citation;
}

export function applyAnnotatedSegmentsToText(
  text: string,
  segments?: AnnotatedTextSegmentInput[],
  options?: ApplyAnnotatedSegmentsOptions,
): string {
  const normalizedSegments = normalizeAnnotatedTextSegments(segments);
  if (!normalizedSegments.length) return text;

  const plainText = options?.preformatted ? text : htmlToPlainText(text);
  if (!plainText) return "";

  let result = "";
  let currentIndex = 0;

  normalizedSegments.forEach((segment) => {
    const start = Math.min(
      Math.max(segment.start, currentIndex),
      plainText.length,
    );
    const end = Math.min(Math.max(segment.end, start), plainText.length);
    if (end <= start) return;

    if (start > currentIndex) {
      result += formatPlainTextAsHtml(plainText.slice(currentIndex, start));
    }

    const omittedText = plainText.slice(start, end);
    const note = getSegmentNote(segment);

    if (segment.type === "supplement") {
      result += formatPlainTextAsHtml(omittedText);
    } else if (omittedText.trim()) {
      const needsLeadingSpace = start > 0 && !/\s/.test(plainText[start - 1]);
      const needsTrailingSpace =
        end < plainText.length && !/\s/.test(plainText[end]);
      const omissionPlaceholder =
        segment.omissionPlaceholder?.trim() || "[...]";
      result += `${needsLeadingSpace ? " " : ""}${escapeHtml(omissionPlaceholder)}${needsTrailingSpace ? " " : ""}`;
    }

    if (note) {
      result += ` <span class="italic text-muted-foreground">[${escapeHtml(note)}]</span>`;
    }

    currentIndex = end;
  });

  if (currentIndex < plainText.length) {
    result += formatPlainTextAsHtml(plainText.slice(currentIndex));
  }

  return result;
}

/**
 * Removes a rendered prefix/key even when the source HTML wraps parts of the key with tags.
 * Example: "<strong>I</strong> - texto" with key "I - ".
 */
export function stripRedundantLeadingKey(
  rawText: string,
  key?: string,
): string {
  if (!rawText || !key?.trim()) return rawText;

  const INTERSTITIAL = "(?:<[^>]+>|&nbsp;|\\s|\\u00A0)*";
  const withoutLeadingClosers = rawText
    .replace(new RegExp(`^(?:${INTERSTITIAL}</[^>]+>)+`, "i"), "")
    .trim();
  const tokens = Array.from(key.trim());
  const pattern = tokens.reduce((acc, token) => {
    if (/\s/.test(token)) {
      return `${acc}${INTERSTITIAL}`;
    }

    return `${acc}${escapeRegex(token)}${INTERSTITIAL}`;
  }, `^${INTERSTITIAL}`);

  return withoutLeadingClosers.replace(new RegExp(pattern, "i"), "").trim();
}

/**
 * Robustly removes normative prefixes (Art. 1, § 2, I -, etc.) from the start of a text.
 */
export function getCleanDisplayText(
  rawText: string,
  type: string,
  index?: string,
): string {
  if (!rawText) return "";
  let clean = rawText.trim();

  // Remove wrapping <p> if it's the only thing
  if (
    clean.startsWith("<p>") &&
    clean.endsWith("</p>") &&
    clean.indexOf("<p>", 1) === -1
  ) {
    clean = clean.substring(3, clean.length - 4).trim();
  }

  if (!index) return clean;

  const SPACE_OPT = "[\\s.-]*";
  const SPACE_PLUS = "[\\s.-]+";
  const TAGS_PREFIX =
    "(?:<(?:b|i|s|u|strong|em|strike|span|p|div|mark|small|big)[^>]*>)*";
  const INTERSTITIAL = "(?:<[^>]+>|&nbsp;|[\\s\\u00A0])*";
  const LIST_SEPARATOR = "(?:<[^>]+>|&nbsp;|[\\s\\u00A0]|[.\\-–—)])+";
  const DUPLICATED_ORDINAL = "(?:\\s*[º°oᵒ∘ª](?=\\s+[A-ZÀ-Ý]))?";
  // Optional whitespace including NBSP which is common in editors but not caught by trim()
  const OPT_WS = "[\\s\\u00A0]*";

  // Escape index for regex and handle common variations
  const escapedIndex = buildFlexibleNumericIndexPattern(index);

  // Regex patterns for various normative types
  // Note: We add OPT_WS after TAGS_PREFIX to handle cases where text starts with &nbsp; (common in Tiptap)
  const prefixPatterns: Record<string, RegExp> = {
    Artigo: new RegExp(
      `^${TAGS_PREFIX}${OPT_WS}Art(?:igo|\\.)${SPACE_OPT}${escapedIndex}[.º°oᵒ∘ª]?${DUPLICATED_ORDINAL}${SPACE_OPT}`,
      "i",
    ),
    Parágrafo:
      index === "único"
        ? new RegExp(
            `^${TAGS_PREFIX}${OPT_WS}(?:PAR[ÁA]GRAFO)${SPACE_PLUS}[UÚ]NICO${SPACE_OPT}`,
            "i",
          )
        : new RegExp(
            `^${TAGS_PREFIX}${OPT_WS}§${SPACE_OPT}${escapedIndex}[.º°oᵒ∘ª]?${DUPLICATED_ORDINAL}${SPACE_OPT}`,
            "i",
          ),
    // List-like elements require an actual separator after the index; otherwise the second cleanup pass
    // may eat the first character of the content when it starts with the same letter/number.
    Inciso: new RegExp(
      `^${TAGS_PREFIX}${OPT_WS}${escapedIndex}${LIST_SEPARATOR}${INTERSTITIAL}`,
      "i",
    ),
    Alínea: new RegExp(
      `^${TAGS_PREFIX}${OPT_WS}${escapedIndex}${LIST_SEPARATOR}${INTERSTITIAL}`,
      "i",
    ),
    Item: new RegExp(
      `^${TAGS_PREFIX}${OPT_WS}${escapedIndex}${LIST_SEPARATOR}${INTERSTITIAL}`,
      "i",
    ),
    Capítulo: new RegExp(
      `^${TAGS_PREFIX}${OPT_WS}CAP[IÍ]TULO${SPACE_PLUS}${escapedIndex}${SPACE_OPT}[\\-–—]?${SPACE_OPT}`,
      "i",
    ),
    Seção: new RegExp(
      `^${TAGS_PREFIX}${OPT_WS}SE[CÇ][AÃ]O${SPACE_PLUS}${escapedIndex}${SPACE_OPT}[\\-–—]?${SPACE_OPT}`,
      "i",
    ),
    Subseção: new RegExp(
      `^${TAGS_PREFIX}${OPT_WS}SUBSE[CÇ][AÃ]O${SPACE_PLUS}${escapedIndex}${SPACE_OPT}[\\-–—]?${SPACE_OPT}`,
      "i",
    ),
    Título: new RegExp(
      `^${TAGS_PREFIX}${OPT_WS}T[IÍ]TULO${SPACE_PLUS}${escapedIndex}${SPACE_OPT}[\\-–—]?${SPACE_OPT}`,
      "i",
    ),
    Livro: new RegExp(
      `^${TAGS_PREFIX}${OPT_WS}LIVRO${SPACE_PLUS}${escapedIndex}${SPACE_OPT}[\\-–—]?${SPACE_OPT}`,
      "i",
    ),
    Parte: new RegExp(
      `^${TAGS_PREFIX}${OPT_WS}PARTE${SPACE_PLUS}${escapedIndex}${SPACE_OPT}[\\-–—]?${SPACE_OPT}`,
      "i",
    ),
    Nota: new RegExp(
      `^${TAGS_PREFIX}${OPT_WS}\\(${escapedIndex}\\)${SPACE_OPT}[\\-–—]?${SPACE_OPT}`,
      "i",
    ),
  };

  const pattern = prefixPatterns[type];
  if (pattern) {
    // Apply twice to catch double prefixes like "Art. 36 Art. 36."
    clean = clean.replace(pattern, "").trim();
    clean = clean.replace(pattern, "").trim();
  }

  // Catch-all for any remaining leading dashes or dots often left behind
  clean = clean.replace(/^[.\-\s–—]+/, "").trim();

  return clean;
}
