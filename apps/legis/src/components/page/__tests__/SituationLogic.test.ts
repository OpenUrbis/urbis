import { describe, it, expect } from 'vitest';
import { 
    groupSituationsForElement, 
    getElementStyle, 
    isValidityNotStarted, 
    isValidityEnded,
    SituationGroup,
    SITUATION_TYPE_MAP
} from '../SituationLogic';
import { NormativeElementEntity, SpecialSituation } from '../../../domain/entities';

// Helper to create mock element
const createElement = (situations: SpecialSituation[] = [], validity: any = {}): NormativeElementEntity => ({
    id: 'test-el',
    type: 'Artigo',
    index: '1',
    text: 'Test content',
    specialSituations: situations,
    originalStartValidity: validity.start || { date: '01.01.2020', deviceId: 'Lei 1' },
    originalEndValidity: validity.end
});

describe('SituationLogic', () => {
    describe('groupSituationsForElement', () => {
        it('should group Veto and Derrubada together', () => {
            const el = createElement([
                { type: 'Veto', date: '01.01.2021' },
                { type: 'Derrubada de veto', date: '01.02.2021' }
            ]);

            const groups = groupSituationsForElement(el);
            expect(groups).toHaveLength(1);
            expect(groups[0].type).toBe('VETO_GROUP');
            expect(groups[0].situations).toHaveLength(2);
        });

        it('should group Alterations together', () => {
            const el = createElement([
                { type: 'Nova redação', date: '01.01.2022' },
                { type: 'Renumeração', date: '01.02.2022' }
            ]);

            const groups = groupSituationsForElement(el);
            expect(groups).toHaveLength(1);
            expect(groups[0].type).toBe('ALTERATION_GROUP');
        });

        it('should order situations chronologically (newest first)', () => {
            const el = createElement([
                { type: 'Veto', date: '01.01.2021' },
                { type: 'Derrubada de veto', date: '01.03.2021' }, // Newer
                { type: 'Veto', date: '01.02.2021' }
            ]);

            const groups = groupSituationsForElement(el);
            const dates = groups[0].situations.map(s => s.date);
            expect(dates).toEqual(['01.03.2021', '01.02.2021', '01.01.2021']);
        });

        it('should order groups by latest situation date', () => {
            const el = createElement([
                { type: 'Veto', date: '01.01.2020' }, // Older group
                { type: 'Nova redação', date: '01.01.2022' } // Newer group
            ]);

            const groups = groupSituationsForElement(el);
            expect(groups).toHaveLength(2);
            expect(groups[0].type).toBe('ALTERATION_GROUP'); // Newer first
            expect(groups[1].type).toBe('VETO_GROUP');
        });
    });

    describe('getElementStyle', () => {
        it('should return empty style for no situations', () => {
            const el = createElement([]);
            expect(getElementStyle(el)).toEqual({});
        });

        it('should apply line-through for Veto', () => {
            const el = createElement([{ type: 'Veto', date: '01.01.2021' }]);
            expect(getElementStyle(el)).toEqual({ textDecoration: 'line-through' });
        });

        it('should NOT apply line-through if Veto is Overturned (Derrubada)', () => {
            const el = createElement([
                { type: 'Veto', date: '01.01.2021' },
                { type: 'Derrubada de veto', date: '01.02.2021' }
            ]);
            // Derrubada makes it Orange
            expect(getElementStyle(el)).toEqual({ color: 'orange' });
        });

        it('should apply Blue for Nova Redação', () => {
            const el = createElement([{ type: 'Nova redação', date: '01.01.2022' }]);
            expect(getElementStyle(el)).toEqual({ color: 'blue', fontWeight: 'bold' });
        });

        it('should apply Orange for Derrubada alone', () => {
            const el = createElement([{ type: 'Derrubada de veto', date: '01.01.2022' }]);
            expect(getElementStyle(el)).toEqual({ color: 'orange' });
        });

        it('should apply Red for Future Validity', () => {
            // Mock future date
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);
            const dateStr = `${String(futureDate.getDate()).padStart(2, '0')}.${String(futureDate.getMonth()+1).padStart(2, '0')}.${futureDate.getFullYear()}`;
            
            const el = createElement([{ type: 'Vigência inicial alterada', date: dateStr }]);
            expect(getElementStyle(el)).toEqual({ color: 'red' });
        });

        it('should apply Underline for Interpretation', () => {
            const el = createElement([{ type: 'Interpretação conforme à Constituição', date: '01.01.2022' }]);
            expect(getElementStyle(el)).toEqual({ textDecoration: 'underline' });
        });
        
        it('should prioritize Blue (New) over Orange', () => {
             // If somehow it has both? Usually mutually exclusive or chronological.
             // Code checks 'hasNew' first.
             const el = createElement([
                 { type: 'Nova redação', date: '01.01.2022' },
                 { type: 'Repristinação', date: '01.02.2022' }
             ]);
             expect(getElementStyle(el)).toEqual({ color: 'blue', fontWeight: 'bold' });
        });
    });

    describe('Validity Checks', () => {
        it('isValidityNotStarted returns true for future date', () => {
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);
            const dateStr = `${String(futureDate.getDate()).padStart(2, '0')}.${String(futureDate.getMonth()+1).padStart(2, '0')}.${futureDate.getFullYear()}`;
            
            const el = createElement([{ type: 'Vigência inicial alterada', date: dateStr }]);
            expect(isValidityNotStarted(el)).toBe(true);
        });

        it('isValidityEnded returns true for past end date', () => {
            const el = createElement([], { end: { date: '01.01.2000', deviceId: 'Lei 1' } }); // Original end validity
            expect(isValidityEnded(el, { date: '01.01.2000' })).toBe(true);
        });
    });
});
