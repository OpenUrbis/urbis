import { NormativeElementEntity, SpecialSituation } from '../../domain/entities';
import { parse, isValid, compareDesc, isAfter } from 'date-fns';
import { Ban, Edit, AlertTriangle, RefreshCw, FileText, Clock, Info } from 'lucide-react';
import React from 'react';

export type SituationGroupType = 
    | 'VETO_GROUP' 
    | 'ALTERATION_GROUP' 
    | 'VIGOR_GROUP' 
    | 'EXISTENCE_GROUP'
    | 'INTERPRETATION_GROUP'
    | 'VALIDITY_GROUP'
    | 'OTHER';

export interface SituationGroup {
    id: string;
    elementId: string;
    elementKey: string;
    type: SituationGroupType;
    situations: SpecialSituation[];
    latestDate: Date;
}

export const SITUATION_TYPE_MAP: Record<string, SituationGroupType> = {
    'Veto': 'VETO_GROUP',
    'Derrubada de veto': 'VETO_GROUP',
    
    'Renumeração': 'ALTERATION_GROUP',
    'Nova redação': 'ALTERATION_GROUP',
    'Alteração de ementa': 'ALTERATION_GROUP',
    
    'Suspensão de vigor/eficácia': 'VIGOR_GROUP',
    'Restauração de vigor/eficácia': 'VIGOR_GROUP',
    'Perda definitiva de vigor/eficácia': 'VIGOR_GROUP',
    
    'Acréscimo': 'EXISTENCE_GROUP',
    'Revogação': 'EXISTENCE_GROUP',
    'Anulação': 'EXISTENCE_GROUP',
    'Cassação': 'EXISTENCE_GROUP',
    'Repristinação': 'EXISTENCE_GROUP',
    'Extinção': 'EXISTENCE_GROUP',

    'Interpretação conforme à Constituição': 'INTERPRETATION_GROUP',
    'Declaração de inconstitucionalidade sem redução de texto': 'INTERPRETATION_GROUP',
    
    'Vigência inicial alterada': 'VALIDITY_GROUP',
    'Vigência final alterada': 'VALIDITY_GROUP',
};

export const GROUP_TITLES: Record<SituationGroupType, string> = {
    'VETO_GROUP': 'Vetos e Derrubada de Vetos',
    'ALTERATION_GROUP': 'Renumerações e Novas redações',
    'VIGOR_GROUP': 'Retiradas e Restauração de vigor/eficácia',
    'EXISTENCE_GROUP': 'Acréscimos, Extinções e Repristinações',
    'INTERPRETATION_GROUP': 'Interpretações',
    'VALIDITY_GROUP': 'Vigência',
    'OTHER': 'Outras Situações'
};

export const parseDate = (dateStr?: string) => {
    if (!dateStr || dateStr === 'vigência condicionada') return new Date(0);
    try {
        const d = parse(dateStr, 'dd.MM.yyyy', new Date());
        return isValid(d) ? d : new Date(0);
    } catch { return new Date(0); }
};

export function getIconForType(type: SituationGroupType) {
    switch (type) {
        case 'VETO_GROUP': return React.createElement(Ban, { className: "h-3.5 w-3.5" });
        case 'ALTERATION_GROUP': return React.createElement(Edit, { className: "h-3.5 w-3.5" });
        case 'VIGOR_GROUP': return React.createElement(AlertTriangle, { className: "h-3.5 w-3.5" });
        case 'EXISTENCE_GROUP': return React.createElement(RefreshCw, { className: "h-3.5 w-3.5" });
        case 'INTERPRETATION_GROUP': return React.createElement(FileText, { className: "h-3.5 w-3.5" });
        case 'VALIDITY_GROUP': return React.createElement(Clock, { className: "h-3.5 w-3.5" });
        default: return React.createElement(Info, { className: "h-3.5 w-3.5" });
    }
}

/**
 * Determines if an element's validity hasn't started yet.
 * Based on the latest "Vigência inicial alterada" or the original start validity.
 */
export function isValidityNotStarted(element: NormativeElementEntity): boolean {
    const alterations = (element.specialSituations || [])
        .filter(s => s.type === 'Vigência inicial alterada')
        .sort((a, b) => compareDesc(parseDate(a.date), parseDate(b.date)));

    const effectiveDateStr = alterations.length > 0 ? alterations[0].date : element.originalStartValidity?.date;
    
    if (effectiveDateStr === 'vigência condicionada') return true;
    
    const effectiveDate = parseDate(effectiveDateStr);
    return isAfter(effectiveDate, new Date());
}

/**
 * Determines if an element's validity has ended.
 * Based on the latest "Vigência final alterada" or the original end validity.
 */
export function isValidityEnded(element: NormativeElementEntity, originalEndValidity?: any): boolean {
    const alterations = (element.specialSituations || [])
        .filter(s => s.type === 'Vigência final alterada')
        .sort((a, b) => compareDesc(parseDate(a.date), parseDate(b.date)));

    const effectiveDateStr = alterations.length > 0 ? alterations[0].date : originalEndValidity?.date;
    
    if (!effectiveDateStr) return false;
    if (effectiveDateStr === 'vigência condicionada') return true;
    
    const effectiveDate = parseDate(effectiveDateStr);
    return !isAfter(effectiveDate, new Date());
}

export function groupSituationsForElement(element: NormativeElementEntity): SituationGroup[] {
    if (!element.specialSituations || element.specialSituations.length === 0) return [];

    const byType: Record<string, SpecialSituation[]> = {};

    element.specialSituations.forEach((sit) => {
        const typeClass = SITUATION_TYPE_MAP[sit.type] || 'OTHER';
        if (!byType[typeClass]) byType[typeClass] = [];
        byType[typeClass].push(sit);
    });

    const result: SituationGroup[] = [];

    Object.entries(byType).forEach(([typeClass, sits]) => {
        sits.sort((a, b) => compareDesc(parseDate(a.date), parseDate(b.date)));
        const latestDate = parseDate(sits[0].date);

        result.push({
            id: `${element.id}-${typeClass}`,
            elementId: element.id,
            elementKey: `${element.type} ${element.index || ''}`,
            type: typeClass as SituationGroupType,
            situations: sits,
            latestDate,
        });
    });

    // Sort groups: newest first
    result.sort((a, b) => compareDesc(a.latestDate, b.latestDate));
    return result;
}

/**
 * Calculates display style for a normative element based on its situations.
 */
export function getElementStyle(element: NormativeElementEntity, originalEndValidity?: any): {
    color?: string;
    textDecoration?: string;
    fontWeight?: string;
} {
    const situations = element.specialSituations || [];

    // Check for Repristination/Restoration logic
    const repristination = situations.find(s => s.type === 'Repristinação');
    const restoration = situations.find(s => s.type === 'Restauração de vigor/eficácia');
    
    let isRestoredActive = false;
    
    if (repristination) {
        const d = parseDate(repristination.date);
        // Active if date is valid and in past/today (not future)
        if (!isAfter(d, new Date())) isRestoredActive = true;
    }
    
    if (restoration) {
        const d = parseDate(restoration.date);
        if (!isAfter(d, new Date())) isRestoredActive = true;
    }

    const isFuture = isValidityNotStarted(element);
    const isExpired = isValidityEnded(element, originalEndValidity);
    
    // Explicit checks for negative situations (in case isExpired misses them)
    const hasVeto = situations.some(s => s.type === 'Veto');
    const hasRevocation = situations.some(s => ['Revogação', 'Anulação', 'Cassação', 'Perda definitiva de vigor/eficácia', 'Suspensão de vigor/eficácia'].includes(s.type));
    
    // Check for positive counter-situations
    const hasDerrubada = situations.some(s => s.type === 'Derrubada de veto');

    // Vermelho: texto ainda sem vigor ou que será extinto ou tornado sem vigor/eficácia em breve
    if (isFuture) {
        return { color: 'red' };
    }

    // Tachado: texto extinto, ou sem vigor/eficácia
    
    // Case 1: Veto without Derrubada
    if (hasVeto && !hasDerrubada) {
        return { textDecoration: 'line-through' };
    }

    // Case 2: Expired or Revoked, AND NOT Repristinated/Restored
    if ((isExpired || hasRevocation) && !isRestoredActive) {
        return { textDecoration: 'line-through' };
    }
    
    // Check for specific situation effects for COLOR
    const hasColorOrangeGroup = situations.some(s => s.type === 'Derrubada de veto' || s.type === 'Repristinação' || s.type === 'Restauração de vigor/eficácia');
    const hasNew = situations.some(s => s.type === 'Nova redação' || s.type === 'Acréscimo' || s.type === 'Renumeração' || s.type === 'Alteração de ementa');
    const hasInterpretation = situations.some(s => s.type === 'Interpretação conforme à Constituição' || s.type === 'Declaração de inconstitucionalidade sem redução de texto');

    // Azul (legível e diferenciado): texto novo em vigor
    if (hasNew) {
        return { color: 'blue', fontWeight: 'bold' };
    }

    // Laranja (legível e de pouca atenção): texto em vigor mas objeto de disputa
    if (hasColorOrangeGroup) {
        return { color: 'orange' };
    }

    // Sublinhado: texto com interpretações específicas fixadas
    if (hasInterpretation) {
        return { textDecoration: 'underline' };
    }

    return {};
}
