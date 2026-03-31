import { NormativeElementEntity as NormativeElement } from './entities';

function normalizeNumericOrdinalIndex(index?: string): string {
  if (!index) return '';

  const normalized = index.trim().replace(/\./g, '');
  const match = normalized.match(/^(\d+)(?:\s*[º°oᵒ∘ª])?$/i);

  if (!match) return normalized;

  const numeric = String(parseInt(match[1], 10));
  const value = Number(numeric);

  return value >= 1 && value <= 9 ? `${numeric}º` : numeric;
}

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
      return `Art. ${normalizeNumericOrdinalIndex(index)} `;

    case 'Parágrafo':
      if (index === 'único' || (text && text.toLowerCase().startsWith('único'))) {
        return 'Parágrafo único. ';
      }
      return `§ ${normalizeNumericOrdinalIndex(index)} `;

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
