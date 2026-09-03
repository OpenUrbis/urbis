import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const validBirthDate: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;
  if (!value) return null;
  if (typeof value !== 'string') return { invalidDate: true };

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return { invalidDate: true };

  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getTime() > Date.now()
  ) {
    return { invalidDate: true };
  }

  // Calculate age to ensure it is at least 16
  const today = new Date();
  let age = today.getFullYear() - year;
  const birthdayHasNotOccurred =
    today.getMonth() + 1 < month ||
    (today.getMonth() + 1 === month && today.getDate() < day);

  if (birthdayHasNotOccurred) age--;

  if (age < 16) {
    return { underSixteen: true };
  }

  return null;
};
