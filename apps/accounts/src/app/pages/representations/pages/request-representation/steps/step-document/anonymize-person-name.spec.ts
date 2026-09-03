import { anonymizePersonName } from './anonymize-person-name';

describe('anonymizePersonName', () => {
  it('keeps the first and last three non-space characters for long names', () => {
    expect(anonymizePersonName('Mauryas de Castro Manzoli')).toBe(
      'Mau****************oli',
    );
  });

  it('masks at least half of shorter names', () => {
    expect(anonymizePersonName('José Costa')).toBe('Jo*****ta');
  });

  it('handles optional and short values safely', () => {
    expect(anonymizePersonName('')).toBe('');
    expect(anonymizePersonName(null)).toBe('');
    expect(anonymizePersonName('A')).toBe('*');
    expect(anonymizePersonName('Ana')).toBe('A**');
  });
});
