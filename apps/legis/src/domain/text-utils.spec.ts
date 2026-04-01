import { describe, expect, it } from 'vitest';
import { getCleanDisplayText } from './text-utils';

describe('text-utils', () => {
    it('should remove duplicated ordinal artifacts from article prefixes', () => {
        const result = getCleanDisplayText(
            'Art. 7º o Pode ser declarada a morte presumida, sem decretação de ausência:',
            'Artigo',
            '7'
        );

        expect(result).toBe('Pode ser declarada a morte presumida, sem decretação de ausência:');
    });

    it('should remove article prefixes with thousand separators when index is normalized', () => {
        const result = getCleanDisplayText(
            'Art. 1.000. A sociedade simples que instituir sucursal...',
            'Artigo',
            '1000'
        );

        expect(result).toBe('A sociedade simples que instituir sucursal...');
    });

    it('should preserve the current behavior for articles without thousand separators', () => {
        const result = getCleanDisplayText(
            'Art. 999. As modificações do contrato social...',
            'Artigo',
            '999'
        );

        expect(result).toBe('As modificações do contrato social...');
    });
});