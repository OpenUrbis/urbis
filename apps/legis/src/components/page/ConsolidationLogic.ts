import { NormativeElementEntity, SpecialSituation } from '../../domain/entities';
import { parse, isValid, isBefore, compareDesc } from 'date-fns';

export type ViewMode = 'full' | 'consolidated';

// Helper to parse date (DD.MM.YYYY)
const parseDate = (d?: string) => {
    if (!d || d === 'vigência condicionada') return null;
    const parsed = parse(d, 'dd.MM.yyyy', new Date());
    return isValid(parsed) ? parsed : null;
};

// Check if a situation is "EM VIGOR" (active/latest valid) and inactivates the element
export function isElementInactive(element: NormativeElementEntity): boolean {
    const { specialSituations, originalEndValidity } = element;
    
    // 1. Check Validity Date (Expired)
    const today = new Date();
    const endDate = parseDate(originalEndValidity?.date);
    if (endDate && isBefore(endDate, today)) {
        return true;
    }

    if (!specialSituations || specialSituations.length === 0) return false;

    // 2. Sort situations by date to find latest
    // Assuming situations have dates.
    const sorted = [...specialSituations].sort((a, b) => {
        const dateA = parseDate(a.date) || new Date(0);
        const dateB = parseDate(b.date) || new Date(0);
        return compareDesc(dateA, dateB);
    });
    const latest = sorted[0];

    if (!latest) return false;

    const type = latest.type;

    // "Revogação", "Anulação", "Cassação"
    if (['Revogação', 'Anulação', 'Cassação'].includes(type)) return true;

    // "Veto" (assuming full text veto if element text is "(VETADO)" or similar, or if situation implies it)
    // Requirement says "quando abarcarem o Texto integral".
    // If the element text is just "(VETADO)", it effectively is inactive/hidden content.
    if (type === 'Veto') {
        // Simple heuristic: if text is (VETADO), it is inactive.
        if (element.text?.trim().toUpperCase().includes('(VETADO)')) return true;
        // Or if the situation doesn't specify a partial range? (Mock doesn't have ranges).
        // Let's assume Veto on the element means full veto unless specified otherwise.
        return true;
    }

    // "Perda/Suspensão"
    if (['Perda definitiva de vigor/eficácia', 'Suspensão de vigor/eficácia'].includes(type)) {
        return true; 
    }

    // "Nova redação" (Old version)
    // If this element HAS a "Nova redação" situation, it usually means THIS element IS the new redaction.
    // The OLD element would be the one revoked/replaced.
    // However, if the data model attaches "Nova redação" to the *target* (old), then this is inactive.
    // In our mocks, `ex6_art22_nr` has "Nova redação". It is the NEW one.
    // `ex6_art22` (Old) has NO situations in the mock.
    // This makes it hard to identify `ex6_art22` as inactive without context.
    // Ideally, `ex6_art22` should have "Alterado por..." or "Revogado por...".
    // For now, I will rely on standard "Revogação" logic. 
    // If the user data implies "Nova redação" situation means "This is the NEW one", then it is ACTIVE.
    
    return false;
}

export function isFutureValidity(situation: SpecialSituation): boolean {
    return situation.type === 'Vigência inicial alterada' || situation.type === 'Vigência final alterada'; // Rough check
}

export interface ProcessedElementWrapper {
    element: NormativeElementEntity;
    isSeparator: boolean; // Is this a standalone separator? No, usually separator is visually between elements.
    showSeparatorAbove: boolean;
}

export function processElementsForConsolidated(elements: NormativeElementEntity[]): NormativeElementEntity[] {
    // 1. Identify status of each element
    const statusMap = new Map<string, boolean>(); // id -> isInactive
    elements.forEach(el => {
        statusMap.set(el.id, isElementInactive(el));
    });

    // 2. Identify inactive headers (recursive-ish or lookahead)
    // "Header is inactive if all sequences immediately inside it... are inactive"
    // We can do a pass to mark headers.
    // Simplified: If a header is followed by only inactive elements until the next header of equal/higher level, it is inactive.
    
    const hierarchy = ['Parte', 'Livro', 'Título', 'Capítulo', 'Seção', 'Subseção'];
    const getLevel = (type: string) => hierarchy.indexOf(type);

    const finalStatusMap = new Map(statusMap);

    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        const level = getLevel(el.type);
        
        if (level !== -1) {
            // It's a header. Check content.
            let allContentInactive = true;
            let hasContent = false;

            for (let j = i + 1; j < elements.length; j++) {
                const next = elements[j];
                const nextLevel = getLevel(next.type);
                
                if (nextLevel !== -1 && nextLevel <= level) {
                    // Found next header of equal or higher level (lower index = higher level)
                    break;
                }
                
                hasContent = true;
                if (!statusMap.get(next.id)) {
                    allContentInactive = false;
                    break;
                }
            }

            if (hasContent && allContentInactive) {
                finalStatusMap.set(el.id, true);
            }
        }
    }

    // 3. Filter and Insert Separators
    const result: NormativeElementEntity[] = [];
    let lastWasInactive = false;

    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        const isInactive = finalStatusMap.get(el.id);

        if (isInactive) {
            if (!lastWasInactive) {
                // Entering inactive sequence - insert separator immediately
                result.push({
                    id: `sep-${el.id}`,
                    type: 'Separator',
                    text: '[...]',
                    index: '',
                    specialSituations: [],
                    originalStartValidity: { date: '', deviceId: '' }
                } as any);
            }
            lastWasInactive = true;
            continue;
        }

        result.push(el);
        lastWasInactive = false;
    }

    return result;
}
