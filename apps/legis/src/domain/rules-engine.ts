import { ElementType, SpecialSituation } from './types';

export interface ParsingResult {
    type: ElementType;
    index?: string;
    content: string;
    ruleId?: string;
    specialSituations?: SpecialSituation[];
}

export interface ParsingRule {
    id: string;
    name: string;
    regex: RegExp;
    type: ElementType;
    priority: number;
    extract: (match: RegExpMatchArray) => { index?: string; content: string };
}

// Regex helpers from script
const TAGS_PREFIX = '(?:<(?:b|i|s|u|strong|em|strike|span)[^>]*>)*';
const SPACE = '[\\s.-]';
const SPACE_PLUS = SPACE + '+';
const SPACE_OPT = SPACE + '*';

export const DEFAULT_RULES: ParsingRule[] = [
    {
        id: 'parte',
        name: 'Parte',
        regex: new RegExp(`^${TAGS_PREFIX}PARTE${SPACE_PLUS}([IVXLCDM]+|[A-Z]+)${SPACE_OPT}(.*)`, 'i'),
        type: 'Parte',
        priority: 5,
        extract: (m) => ({ index: m[1], content: m[2] })
    },
    {
        id: 'livro',
        name: 'Livro',
        regex: new RegExp(`^${TAGS_PREFIX}LIVRO${SPACE_PLUS}([IVXLCDM]+|[A-Z]+)${SPACE_OPT}(.*)`, 'i'),
        type: 'Livro',
        priority: 6,
        extract: (m) => ({ index: m[1], content: m[2] })
    },
    {
        id: 'titulo',
        name: 'Título',
        regex: new RegExp(`^${TAGS_PREFIX}TÍTULO${SPACE_PLUS}([IVXLCDM]+)${SPACE_OPT}(.*)`, 'i'),
        type: 'Título',
        priority: 7,
        extract: (m) => ({ index: m[1], content: m[2] })
    },
    {
        id: 'capitulo',
        name: 'Capítulo',
        regex: new RegExp(`^${TAGS_PREFIX}CAPÍTULO${SPACE_PLUS}([IVXLCDM]+|\\d+)${SPACE_OPT}(.*)`, 'i'),
        type: 'Capítulo',
        priority: 10,
        extract: (m) => ({ index: m[1], content: m[2] })
    },
    {
        id: 'secao',
        name: 'Seção',
        regex: new RegExp(`^${TAGS_PREFIX}SEÇÃO${SPACE_PLUS}([IVXLCDM]+)${SPACE_OPT}(.*)`, 'i'),
        type: 'Seção',
        priority: 11,
        extract: (m) => ({ index: m[1], content: m[2] })
    },
    {
        id: 'subsecao',
        name: 'Subseção',
        regex: new RegExp(`^${TAGS_PREFIX}SUBSEÇÃO${SPACE_PLUS}([IVXLCDM]+)${SPACE_OPT}(.*)`, 'i'),
        type: 'Subseção',
        priority: 12,
        extract: (m) => ({ index: m[1], content: m[2] })
    },
    {
        id: 'artigo',
        name: 'Artigo',
        regex: new RegExp(`^${TAGS_PREFIX}Art(?:igo|\\.)${SPACE_OPT}(\\d+)[.º°oᵒ∘ª]?${SPACE_OPT}(.*)`, 'i'),
        type: 'Artigo',
        priority: 20,
        extract: (m) => {
            const num = parseInt(m[1], 10);
            const index = (num >= 1 && num <= 9) ? `${num}º` : `${num}`;
            // Clean content to avoid repeating the article prefix
            const content = m[2].trim();
            return { index, content };
        }
    },
    {
        id: 'paragrafo_unico',
        name: 'Parágrafo Único',
        regex: new RegExp(`^${TAGS_PREFIX}(?:PARÁGRAFO|PARAGRAFO)${SPACE_PLUS}ÚNICO${SPACE_OPT}(.*)`, 'i'),
        type: 'Parágrafo',
        priority: 29,
        extract: (m) => ({ index: 'único', content: m[1] })
    },
    {
        id: 'paragrafo',
        name: 'Parágrafo',
        regex: new RegExp(`^${TAGS_PREFIX}§${SPACE_OPT}(\\d+)[.º°oᵒ∘ª]?${SPACE_OPT}(.*)`, 'i'),
        type: 'Parágrafo',
        priority: 30,
        extract: (m) => {
            const num = parseInt(m[1], 10);
            const index = (num >= 1 && num <= 9) ? `${num}º` : `${num}`;
            return { index, content: m[2] };
        }
    },
    {
        id: 'inciso',
        name: 'Inciso',
        regex: new RegExp(`^${TAGS_PREFIX}([IVXLCDM]+)${SPACE_PLUS}(.*)`, 'i'), 
        type: 'Inciso',
        priority: 40,
        extract: (m) => ({ index: m[1].toUpperCase(), content: m[2] })
    },
    {
        id: 'alinea',
        name: 'Alínea',
        regex: new RegExp(`^${TAGS_PREFIX}([a-z])\\)${SPACE_OPT}(.*)`, 'i'),
        type: 'Alínea',
        priority: 50,
        extract: (m) => ({ index: m[1], content: m[2] })
    },
    {
        id: 'item',
        name: 'Item',
        regex: new RegExp(`^${TAGS_PREFIX}(\\d+)\\.${SPACE_OPT}(.*)`, 'i'),
        type: 'Item',
        priority: 60,
        extract: (m) => ({ index: m[1], content: m[2] })
    }
];

export class RulesEngine {
    private rules: ParsingRule[];

    constructor(customRules: ParsingRule[] = []) {
        this.rules = [...DEFAULT_RULES, ...customRules].sort((a, b) => a.priority - b.priority);
    }

    parseLine(line: string): ParsingResult {
        const trimmed = line.trim();
        
        // 1. Detect if line is "riscado" (Revoked/Vetoed)
        let isRevoked = false;
        // Logic from script: checks if wrapped in <s> or if contains "REVOGADO"
        // If the *entire* content is wrapped in <s>, it's revoked.
        // We check this by removing outer tags and seeing if <s> wraps inner content?
        // Or simple regex check.
        if (/<s\b[^>]*>(.*?)<\/s>/i.test(trimmed) || 
            /<strike\b[^>]*>(.*?)<\/strike>/i.test(trimmed) || 
            /text-decoration:\s*line-through/i.test(trimmed)) {
            
            // Heuristic: if it starts with <s> and ends with </s>
            if ((trimmed.startsWith('<s>') && trimmed.endsWith('</s>')) || 
                (trimmed.startsWith('<strike>') && trimmed.endsWith('</strike>'))) {
                isRevoked = true;
            }
            // Or if it contains "(REVOGADO)" or "(VETADO)"
            if (/\(REVOGADO\)/i.test(trimmed) || /\(VETADO\)/i.test(trimmed)) {
                isRevoked = true;
            }
        }

        // We do NOT strip HTML for matching anymore, because we use regex that handles tags prefix.
        // This ensures bold/italic prefixes don't break matching.

        for (const rule of this.rules) {
            const match = trimmed.match(rule.regex);
            if (match) {
                const extracted = rule.extract(match);
                
                const situations: SpecialSituation[] = [];
                if (isRevoked) {
                    // Refine type based on content
                    let type: any = 'Revogação';
                    if (/\(VETADO\)/i.test(trimmed)) type = 'Veto';
                    
                    situations.push({
                        type: type,
                        date: '', 
                        relatedDeviceId: 'Texto Original'
                    });
                }

                return {
                    type: rule.type,
                    index: extracted.index,
                    content: extracted.content, // Return extracted content (stripped of prefix)
                    ruleId: rule.id,
                    specialSituations: situations
                };
            }
        }

        return { type: 'Texto', content: line };
    }
}
