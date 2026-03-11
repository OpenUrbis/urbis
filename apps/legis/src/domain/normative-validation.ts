import { NormativeElementEntity, ElementType } from './entities';

export interface ValidationIssue {
    elementId: string;
    message: string;
    severity: 'warning' | 'error';
}

export function validateElement(element: NormativeElementEntity): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { type, index } = element;
    
    // Helper to check regex
    const matches = (str: string, regex: RegExp) => regex.test(str);

    // 1. Artigos e Parágrafos devem iniciar por número (exceto Parágrafo Único)
    if ((type === 'Artigo' || type === 'Parágrafo') && index?.toLowerCase() !== 'único') {
        if (index && !matches(index, /^\d/)) {
            issues.push({
                elementId: element.id,
                message: `Artigos e parágrafos em geral iniciam por número (encontrado: "${index}")`,
                severity: 'warning'
            });
        }

        // 2. Artigos e Parágrafos de 1 a 9 devem ter ordinal
        if (index) {
            const numMatch = index.match(/^(\d+)/);
            if (numMatch) {
                const num = parseInt(numMatch[1], 10);
                if (num >= 1 && num <= 9) {
                    if (!matches(index, /[º°oᵒ∘ª]/)) {
                        issues.push({
                            elementId: element.id,
                            message: `Artigos e parágrafos de 1 a 9 em geral são seguidos por sinal ordinal ("º")`,
                            severity: 'warning'
                        });
                    }
                }
            }
        }
    }

    // 3. Romanos para Parte, Livro, Título, Capítulo, Seção, Subseção, Inciso
    const romanTypes: ElementType[] = [
        'Parte',
        'Livro',
        'Título',
        'Capítulo',
        'Seção',
        'Subseção',
        'Inciso',
    ];
    if (romanTypes.includes(type) && index) {
        // Simple roman numeral check (I, V, X, L, C, D, M case insensitive)
        if (!matches(index, /^[IVXLCDMivxlcdm]+$/)) {
            issues.push({
                elementId: element.id,
                message: `Partes, Livros, Títulos, Capítulos, Seções, Subseções ou Incisos em geral iniciam com número romano (encontrado: "${index}")`,
                severity: 'warning',
            });
        }
    }

    // 4. Alíneas devem iniciar com letra minúscula
    if (type === 'Alínea' && index) {
        if (!matches(index, /^[a-z]/)) {
             issues.push({
                elementId: element.id,
                message: `Alíneas em geral iniciam com letras minúsculas`,
                severity: 'warning'
            });
        }
        
        // 5. Alínea não deve ter fechamento de parêntesis no índice (o sistema adiciona na renderização)
        if (index.endsWith(')')) {
             issues.push({
                elementId: element.id,
                message: `Não é necessário incluir o fechamento de parêntesis (")") no final da alínea`,
                severity: 'warning' // or error if strict
            });
        }
    }

    // 6. Pontuação final no índice (exceto Alínea)
    if (type !== 'Alínea' && index) {
        if (matches(index, /[.,;:-\s]$/)) {
            issues.push({
                elementId: element.id,
                message: `Não é necessário incluir espaços ou pontuação ao final do item`,
                severity: 'warning',
            });
        }
    }

    return issues;
}

export function validateNormativeStructure(elements: NormativeElementEntity[]): ValidationIssue[] {
    return elements.flatMap(validateElement);
}
