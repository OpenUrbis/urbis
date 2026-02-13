import { NormativeElement } from './types';

export function getElementKey(element: NormativeElement): string {
  const { type, index, text } = element;

  switch (type) {
    case 'Parte':
      return index ? `${type} ${index} - ` : `${type} `;
    
    case 'Livro':
    case 'Título':
    case 'Capítulo':
    case 'Seção':
    case 'Subseção':
      return `${type} ${index ? index : ''} - `;

    case 'Artigo':
      return `Art. ${index || ''} `;

    case 'Parágrafo':
      if (index === 'único' || text.toLowerCase() === 'único') {
        return 'Parágrafo único. ';
      }
      return `§ ${index || ''} `;

    case 'Inciso':
    case 'Item':
      return `${index || ''} - `;

    case 'Alínea':
      return `${index || ''}) `;

    case 'Divisão desconforme':
    case 'Elemento desconforme':
      return '';

    case 'Tabela':
    case 'Figura':
    case 'Mapa':
      return index ? `${type} ${index} - ` : `${type} `;

    case 'Nota':
      return `(${index}) - `;

    default:
      return '';
  }
}

export function formatElementText(element: NormativeElement): { key: string; content: string } {
    const key = getElementKey(element);
    
    if (element.type === 'Divisão desconforme' || element.type === 'Elemento desconforme') {
        return { key: element.text, content: '' };
    }

    return { key, content: element.text };
}

// Validity Logic
export type ValidityStatus = 'active' | 'future' | 'revoked';

export function getValidityStatus(element: NormativeElement, referenceDate: Date = new Date()): ValidityStatus {
    // Parse date helper (assuming DD.MM.YYYY)
    const parseDate = (dateStr: string) => {
        if (!dateStr || dateStr === 'vigência condicionada') return null;
        const [day, month, year] = dateStr.split('.').map(Number);
        return new Date(year, month - 1, day);
    };

    // Check Start Date
    // Priority: Special Situation > Original
    const startSituation = element.specialSituations?.find(s => s.type === 'Vigência inicial alterada');
    const startDateStr = startSituation?.date || element.originalStartValidity.date;
    
    // If "vigência condicionada", treat as future (or handle specifically) - Spec says "display in red"
    if (startDateStr === 'vigência condicionada') return 'future';

    const startDate = parseDate(startDateStr);
    if (startDate && startDate > referenceDate) {
        return 'future';
    }

    // Check End Date
    const endSituation = element.specialSituations?.find(s => s.type === 'Vigência final alterada' || s.type === 'Perda definitiva de vigor/eficácia' || s.type === 'Suspensão de vigor/eficácia'); // Also check revocation types
    const endDateStr = endSituation?.date || element.originalEndValidity?.date;

    if (endDateStr === 'vigência condicionada') return 'revoked'; // Spec says "display tachado"

    const endDate = endDateStr ? parseDate(endDateStr) : null;
    if (endDate && endDate < referenceDate) {
        return 'revoked';
    }

    return 'active';
}
