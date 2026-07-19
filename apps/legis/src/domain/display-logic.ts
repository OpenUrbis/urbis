import { NormativeElementEntity as NormativeElement } from './entities';

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
      if (index === 'único' || (text && text.toLowerCase().startsWith('único'))) {
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
