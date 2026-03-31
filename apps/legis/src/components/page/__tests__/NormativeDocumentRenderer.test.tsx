import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ElementContent } from '../NormativeDocumentRenderer';

describe('ElementContent', () => {
    it('should add ordinal formatting for single-digit article indexes during visualization', () => {
        const html = renderToStaticMarkup(
            <ElementContent
                element={{
                    id: 'art-7',
                    type: 'Artigo',
                    index: '7',
                    text: 'Art. 7º o Pode ser declarada a morte presumida, sem decretação de ausência:',
                    specialSituations: []
                } as any}
                noteMap={new Map()}
            />
        );

        expect(html).toContain('Art. 7º ');
        expect(html).toContain('Pode ser declarada a morte presumida, sem decretação de ausência:');
        expect(html).not.toContain('Art. 7º o Pode ser declarada a morte presumida, sem decretação de ausência:');
    });

    it('should normalize article visualization when the source text contains a trailing dot after the number', () => {
        const html = renderToStaticMarkup(
            <ElementContent
                element={{
                    id: 'art-31',
                    type: 'Artigo',
                    index: '31',
                    text: 'Art. 31. Os imóveis do ausente só se poderão alienar.',
                    specialSituations: []
                } as any}
                noteMap={new Map()}
            />
        );

        expect(html).toContain('Art. 31 ');
        expect(html).toContain('Os imóveis do ausente só se poderão alienar.');
        expect(html).not.toContain('Art. 31. Os imóveis do ausente só se poderão alienar.');
    });

    it('should normalize article visualization when the source text uses thousand separators', () => {
        const html = renderToStaticMarkup(
            <ElementContent
                element={{
                    id: 'art-1000',
                    type: 'Artigo',
                    index: '1000',
                    text: 'Art. 1.000. A sociedade simples que instituir sucursal.',
                    specialSituations: []
                } as any}
                noteMap={new Map()}
            />
        );

        expect(html).toContain('Art. 1000 ');
        expect(html).toContain('A sociedade simples que instituir sucursal.');
        expect(html).not.toContain('Art. 1.000. A sociedade simples que instituir sucursal.');
    });

    it('should keep articles above nine without ordinal formatting', () => {
        const html = renderToStaticMarkup(
            <ElementContent
                element={{
                    id: 'art-43',
                    type: 'Artigo',
                    index: '43',
                    text: 'Art. 43 As pessoas jurídicas de direito público interno são civilmente responsáveis.',
                    specialSituations: []
                } as any}
                noteMap={new Map()}
            />
        );

        expect(html).toContain('Art. 43 ');
        expect(html).not.toContain('Art. 43º ');
    });
});