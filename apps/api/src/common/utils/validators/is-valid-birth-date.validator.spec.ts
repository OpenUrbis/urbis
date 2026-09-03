import { isValidBirthDate } from './is-valid-birth-date.validator';

describe('isValidBirthDate', () => {
  it.each(['1990-01-01', '2024-02-29'])(
    'accepts a valid past date: %s',
    (value) => {
      expect(isValidBirthDate(value)).toBe(true);
    },
  );

  it.each(['08.02.275760', '2024-02-30', '2024-2-01', 'not-a-date'])(
    'rejects an invalid date: %s',
    (value) => {
      expect(isValidBirthDate(value)).toBe(false);
    },
  );

  it('rejects a future date', () => {
    expect(isValidBirthDate('9999-12-31')).toBe(false);
  });
});
