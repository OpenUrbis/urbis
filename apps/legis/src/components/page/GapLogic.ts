import { NormativeElementEntity } from '../../domain/entities';

// ------------------------------------------------------------------
// Helpers for Gap Detection
// ------------------------------------------------------------------

export function romanToDecimal(roman: string): number {
    const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    let result = 0;
    let prevValue = 0;
    const clean = roman.toUpperCase().trim();
    
    for (let i = clean.length - 1; i >= 0; i--) {
        const char = clean[i];
        const value = map[char] || 0;
        if (value < prevValue) {
            result -= value;
        } else {
            result += value;
        }
        prevValue = value;
    }
    return result;
}

export function getIndexValue(type: string, index: string): number | null {
    if (!index) return null;
    const cleanIndex = index.trim().replace(/[.)º°]/g, ''); // Remove common separators
    
    if (type === 'Inciso') {
        // Roman check
        if (/^[IVXLCDM]+$/i.test(cleanIndex)) {
            return romanToDecimal(cleanIndex);
        }
    } else if (type === 'Alínea') {
        // Single letter check (a-z)
        if (/^[a-z]$/i.test(cleanIndex)) {
            return cleanIndex.toLowerCase().charCodeAt(0) - 96; // a=1
        }
    } 
    
    // Default / Fallback to integer
    if (cleanIndex.toLowerCase() === 'único') return 1;
    
    const num = parseInt(cleanIndex, 10);
    if (!isNaN(num)) return num;
    
    return null;
}

export function checkGap(prev: NormativeElementEntity, curr: NormativeElementEntity): boolean {
    // Se forem de tipos diferentes, não verificamos salto de índice aqui.
    if (prev.type !== curr.type) return false;

    // Se tiverem pais diferentes, também não faz sentido verificar sequência de índice.
    if (prev.parentId !== curr.parentId) return false;

    const prevVal = getIndexValue(prev.type, prev.index || '');
    const currVal = getIndexValue(curr.type, curr.index || '');

    if (prevVal === null || currVal === null) return false;

    // Se a diferença entre os índices for maior que 1, há um salto (Gap).
    return currVal - prevVal > 1;
}

export type GapItem = { type: 'Gap'; id: string };

/**
 * Processa gaps comparando a seleção com a norma original completa.
 */
export function processGapsUnified(
    selectedElements: NormativeElementEntity[], 
    fullElements: NormativeElementEntity[]
): (NormativeElementEntity | GapItem)[] {
    if (!selectedElements.length || !fullElements.length) return selectedElements;

    const result: (NormativeElementEntity | GapItem)[] = [];
    
    // Encontrar os índices na lista original
    const indices = selectedElements.map(se => fullElements.findIndex(fe => fe.id === se.id)).sort((a, b) => a - b);
    
    if (indices.length === 0) return selectedElements;

    // 1. Verificar Gap no início
    if (indices[0] > 0) {
        result.push({ type: 'Gap', id: 'gap-start' });
    }

    for (let i = 0; i < indices.length; i++) {
        const currentIdx = indices[i];
        result.push(fullElements[currentIdx]);

        // 2. Verificar Gap entre este elemento e o próximo
        if (i < indices.length - 1) {
            const nextIdx = indices[i + 1];
            if (nextIdx - currentIdx > 1) {
                result.push({ type: 'Gap', id: `gap-between-${fullElements[currentIdx].id}` });
            }
        }
    }

    // 3. Verificar Gap no fim
    if (indices[indices.length - 1] < fullElements.length - 1) {
        result.push({ type: 'Gap', id: 'gap-end' });
    }

    return result;
}

export function processGaps(elements: NormativeElementEntity[]): (NormativeElementEntity | GapItem)[] {
    // Fallback para a lógica antiga baseada em índices se não tivermos a norma completa
    // (Útil para o componente de visualização de norma original que não precisa de comparação)
    const result: (NormativeElementEntity | GapItem)[] = [];
    const lastSeen: Record<string, NormativeElementEntity> = {};

    elements.forEach((el, _index) => {
        const prevOfSameType = lastSeen[el.type];
        if (prevOfSameType && prevOfSameType.parentId === el.parentId) {
            if (checkGap(prevOfSameType, el)) {
                result.push({ type: 'Gap', id: `gap-seq-${prevOfSameType.id}-${el.id}` });
            }
        }
        lastSeen[el.type] = el;
        result.push(el);
    });
    return result;
}
