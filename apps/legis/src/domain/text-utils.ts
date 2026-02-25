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
            index: index++
        });
    }
    
    return words;
}

/**
 * Calculates start and end WORD indices from a character selection range.
 */
export function getWordIndicesFromSelection(text: string, startChar: number, endChar: number): { startWordIndex: number, endWordIndex: number } | null {
    const words = parseToWordIndex(text);
    if (words.length === 0) return null;

    // Find word that contains startChar or is nearest after?
    // User selects range. The selection might start in the middle of a word.
    // "Correções triviais... alterariam o resultado".
    // We should include the word if it's partially selected? Or only if fully?
    // Usually "expand to word boundaries".
    
    // Logic: find word that overlaps with [startChar, endChar).
    
    const overlapped = words.filter(w => 
        (w.startIndex >= startChar && w.startIndex < endChar) || // Starts inside
        (w.endIndex > startChar && w.endIndex <= endChar) || // Ends inside
        (w.startIndex <= startChar && w.endIndex >= endChar) // Encloses
    );
    
    if (overlapped.length === 0) return null;
    
    const first = overlapped[0];
    const last = overlapped[overlapped.length - 1];
    
    return {
        startWordIndex: first.index,
        endWordIndex: last.index
    };
}

/**
 * Reconstructs text from word indices, adding [...] if needed.
 */
export function extractTextFromWordIndices(text: string, startWordIdx: number, endWordIdx: number, stripQuotes: boolean = false): string {
    const words = parseToWordIndex(text);
    if (words.length === 0) return '';
    
    // Validate indices
    if (startWordIdx < 0 || startWordIdx >= words.length || endWordIdx < startWordIdx) return '';
    
    // Get range of words
    const startWord = words[startWordIdx];
    const endWord = words[endWordIdx >= words.length ? words.length - 1 : endWordIdx];
    
    // Extract raw substring
    let extracted = text.substring(startWord.startIndex, endWord.endIndex);
    
    // Strip quotes logic (for Ementa)
    if (stripQuotes) {
        // Check start
        const quoteChars = /^["'“‘«‹„‚`]/;
        if (quoteChars.test(extracted)) {
            extracted = extracted.replace(quoteChars, '');
        }
        // Check end
        const endQuoteChars = /["'”’»›]$/;
        if (endQuoteChars.test(extracted)) {
            extracted = extracted.replace(endQuoteChars, '');
        }
    }
    
    // Add prefix/suffix [...]
    const prefix = startWordIdx > 0 ? '[...] ' : '';
    const suffix = endWordIdx < words.length - 1 ? ' [...]' : '';

    return `${prefix}${extracted}${suffix}`;
}

/**
 * Normalizes ordinals variations to "º".
 */
export function normalizeOrdinals(text: string): string {
    if (!text) return text;
    // Variations: “º”, “°”, “ᵒ”, “∘”, “o” preceded or not by dot
    return text.replace(/\.?\s*(º|°|ᵒ|∘|o)(?=\s|\.|$)/g, 'º');
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

/**
 * Robustly removes normative prefixes (Art. 1, § 2, I -, etc.) from the start of a text.
 */
export function getCleanDisplayText(rawText: string, type: string, index?: string): string {
    if (!rawText) return '';
    let clean = rawText.trim();
    
    // Remove wrapping <p> if it's the only thing
    if (clean.startsWith('<p>') && clean.endsWith('</p>') && clean.indexOf('<p>', 1) === -1) {
        clean = clean.substring(3, clean.length - 4).trim();
    }

    if (!index) return clean;

    const SPACE_OPT = '[\\s.-]*';
    const SPACE_PLUS = '[\\s.-]+';

    // Escape index for regex and handle common variations
    const escapedIndex = index.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                             .replace(/[º°oᵒ∘ª]/g, '[º°oᵒ∘ª]?');

    // Regex patterns for various normative types
    const prefixPatterns: Record<string, RegExp> = {
        'Artigo': new RegExp(`^Art(?:igo|\\.)${SPACE_OPT}${escapedIndex}[.º°oᵒ∘ª]?${SPACE_OPT}`, 'i'),
        'Parágrafo': index === 'único' 
            ? new RegExp(`^(?:PARÁGRAFO|PARAGRAFO)${SPACE_PLUS}ÚNICO${SPACE_OPT}`, 'i')
            : new RegExp(`^§${SPACE_OPT}${escapedIndex}[.º°oᵒ∘ª]?${SPACE_OPT}`, 'i'),
        'Inciso': new RegExp(`^${escapedIndex}${SPACE_OPT}[\\-–—]${SPACE_OPT}`, 'i'),
        'Alínea': new RegExp(`^${escapedIndex}\\)${SPACE_OPT}`, 'i'),
        'Item': new RegExp(`^${escapedIndex}\\.${SPACE_OPT}`, 'i'),
        'Capítulo': new RegExp(`^CAPÍTULO${SPACE_PLUS}${escapedIndex}${SPACE_OPT}[\\-–—]?${SPACE_OPT}`, 'i'),
        'Seção': new RegExp(`^SEÇÃO${SPACE_PLUS}${escapedIndex}${SPACE_OPT}[\\-–—]?${SPACE_OPT}`, 'i'),
        'Subseção': new RegExp(`^SUBSEÇÃO${SPACE_PLUS}${escapedIndex}${SPACE_OPT}[\\-–—]?${SPACE_OPT}`, 'i'),
        'Título': new RegExp(`^TÍTULO${SPACE_PLUS}${escapedIndex}${SPACE_OPT}[\\-–—]?${SPACE_OPT}`, 'i'),
        'Livro': new RegExp(`^LIVRO${SPACE_PLUS}${escapedIndex}${SPACE_OPT}[\\-–—]?${SPACE_OPT}`, 'i'),
        'Parte': new RegExp(`^PARTE${SPACE_PLUS}${escapedIndex}${SPACE_OPT}[\\-–—]?${SPACE_OPT}`, 'i'),
        'Nota': new RegExp(`^\\(${escapedIndex}\\)${SPACE_OPT}[\\-–—]?${SPACE_OPT}`, 'i'),
    };

    const pattern = prefixPatterns[type];
    if (pattern) {
        // Apply twice to catch double prefixes like "Art. 36 Art. 36."
        clean = clean.replace(pattern, '').trim();
        clean = clean.replace(pattern, '').trim();
    }
    
    // Catch-all for any remaining leading dashes or dots often left behind
    clean = clean.replace(/^[.\-\s–—]+/, '').trim();

    return clean;
}
