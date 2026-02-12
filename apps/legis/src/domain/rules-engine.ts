import { ElementType } from './types';

export interface ParsingRule {
    id: string;
    name: string;
    regex: RegExp;
    type: ElementType;
    priority: number;
    extract: (match: RegExpMatchArray) => { index?: string; content: string };
}

export const DEFAULT_RULES: ParsingRule[] = [
    {
        id: 'capitulo',
        name: 'Capítulo',
        regex: /^CAPÍTULO\s+(\d+)\s*[-–]\s*(.*)/i,
        type: 'Capítulo',
        priority: 10,
        extract: (m) => ({ index: m[1], content: m[2] })
    },
    {
        id: 'titulo',
        name: 'Título',
        regex: /^TÍTULO\s+([IVXLCDM]+)\s*[-–]\s*(.*)/i,
        type: 'Título',
        priority: 10,
        extract: (m) => ({ index: m[1], content: m[2] })
    },
    {
        id: 'secao',
        name: 'Seção',
        regex: /^SEÇÃO\s+([IVXLCDM]+)\s*[-–]\s*(.*)/i,
        type: 'Seção',
        priority: 10,
        extract: (m) => ({ index: m[1], content: m[2] })
    },
    {
        id: 'artigo',
        name: 'Artigo',
        regex: /^Art(?:igo|\.)\s*(\d+)[.º°o]?\s*[-–]?\s*(.*)/i,
        type: 'Artigo',
        priority: 20,
        extract: (m) => {
            const num = parseInt(m[1], 10);
            const index = (num >= 1 && num <= 9) ? `${num}º` : `${num}`;
            return { index, content: m[2] };
        }
    },
    {
        id: 'paragrafo',
        name: 'Parágrafo',
        regex: /^(?:Parágrafo|§)\s*(\d+|único)[.º°o]?\s*[-–]?\s*(.*)/i,
        type: 'Parágrafo',
        priority: 30,
        extract: (m) => {
            let index = 'único';
            if (m[1].toLowerCase() !== 'único') {
                const num = parseInt(m[1], 10);
                index = (num >= 1 && num <= 9) ? `${num}º` : `${num}`;
            }
            return { index, content: m[2] };
        }
    },
    {
        id: 'inciso',
        name: 'Inciso',
        regex: /^([IVXLCDM]+)\s*[-–]\s*(.*)/,
        type: 'Inciso',
        priority: 40,
        extract: (m) => ({ index: m[1], content: m[2] })
    },
    {
        id: 'alinea',
        name: 'Alínea',
        regex: /^([a-z])\)\s*(.*)/,
        type: 'Alínea',
        priority: 50,
        extract: (m) => ({ index: m[1], content: m[2] })
    },
    {
        id: 'item',
        name: 'Item',
        regex: /^(\d+)\.\s*(.*)/,
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

    parseLine(line: string): { type: ElementType, index?: string, content: string, ruleId?: string } {
        const trimmed = line.trim();
        if (!trimmed) return { type: 'Texto', content: '' };

        for (const rule of this.rules) {
            const match = trimmed.match(rule.regex);
            if (match) {
                const extracted = rule.extract(match);
                return {
                    type: rule.type,
                    index: extracted.index,
                    content: extracted.content,
                    ruleId: rule.id
                };
            }
        }

        return { type: 'Texto', content: trimmed };
    }
}
