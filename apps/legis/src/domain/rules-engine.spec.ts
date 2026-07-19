import { describe, it, expect } from 'vitest';
import { RulesEngine } from './rules-engine';

describe('RulesEngine', () => {
    const engine = new RulesEngine();

    it('should parse Articles correctly', () => {
        const line = 'Art. 1º Fica instituída...';
        const result = engine.parseLine(line);
        
        expect(result.type).toBe('Artigo');
        expect(result.index).toBe('1º');
        expect(result.content).toBe('Fica instituída...');
    });

    it('should parse Paragraphs correctly', () => {
        const line1 = '§ 1º O sistema...';
        const result1 = engine.parseLine(line1);
        expect(result1.type).toBe('Parágrafo');
        expect(result1.index).toBe('1º');
        expect(result1.content).toBe('O sistema...');

        const line2 = 'Parágrafo único. A identificação...';
        const result2 = engine.parseLine(line2);
        expect(result2.type).toBe('Parágrafo');
        expect(result2.index).toBe('único');
        expect(result2.content).toBe('A identificação...');
    });

    it('should parse Incisos correctly', () => {
        const line = 'I - identificação...';
        const result = engine.parseLine(line);
        expect(result.type).toBe('Inciso');
        expect(result.index).toBe('I');
        expect(result.content).toBe('identificação...');
    });

    it('should parse Alíneas correctly', () => {
        const line = 'a) coordenadas...';
        const result = engine.parseLine(line);
        expect(result.type).toBe('Alínea');
        expect(result.index).toBe('a');
        expect(result.content).toBe('coordenadas...');
    });

    it('should fallback to Text when no rule matches', () => {
        const line = 'Texto comum sem prefixo normativo.';
        const result = engine.parseLine(line);
        expect(result.type).toBe('Texto');
        expect(result.content).toBe('Texto comum sem prefixo normativo.');
    });
});
