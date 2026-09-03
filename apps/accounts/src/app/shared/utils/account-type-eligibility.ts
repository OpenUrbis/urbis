import { differenceInYears } from 'date-fns';

export const ACCOUNT_TYPES_BY_AGE = {
  adult: ['fisica_capaz'],
  adolescent: [
    'fisica_emancipada',
    'fisica_assistido_parental',
    'fisica_assistido_tutor',
  ],
  underSixteen: [],
} as const;

export function allowedAccountTypesForBirthDate(
  birthDate: string | null | undefined,
): readonly string[] {
  if (!birthDate) return [];

  const age = differenceInYears(new Date(), new Date(`${birthDate}T00:00:00`));
  if (age >= 18) return ACCOUNT_TYPES_BY_AGE.adult;
  if (age >= 16) return ACCOUNT_TYPES_BY_AGE.adolescent;
  return ACCOUNT_TYPES_BY_AGE.underSixteen;
}

export function defaultAccountTypeForBirthDate(
  birthDate: string | null | undefined,
): string | null {
  return allowedAccountTypesForBirthDate(birthDate)[0] ?? null;
}
