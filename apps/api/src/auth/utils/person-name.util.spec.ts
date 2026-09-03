import { normalizePersonName, splitGovBrFullName } from './person-name.util';

describe('person name utilities', () => {
  it('normalizes spaces and capitalization using Brazilian Portuguese', () => {
    expect(normalizePersonName('  joÃO   da SILVA ')).toBe('João da Silva');
    expect(normalizePersonName('ÉRICA   dE   aRAÚJO')).toBe('Érica de Araújo');
    expect(normalizePersonName('MAURYAS DE CASTRO MANZOLI')).toBe(
      'Mauryas de Castro Manzoli',
    );
  });

  it('splits a normalized full name into first and last names', () => {
    expect(splitGovBrFullName('  joÃO   da SILVA ')).toEqual({
      firstName: 'João',
      lastName: 'da Silva',
    });
    expect(splitGovBrFullName('mARIA')).toEqual({
      firstName: 'Maria',
      lastName: '',
    });
  });

  it('handles an empty name', () => {
    expect(splitGovBrFullName()).toEqual({ firstName: '', lastName: '' });
  });
});
