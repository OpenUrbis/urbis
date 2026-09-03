import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const PasswordValidator = {
  equalPasswords: (firstKey: string, secondKey: string) => {
    return (group: AbstractControl): ValidationErrors | null => {
      const { value } = group;
      if (value?.[firstKey] === '') {
        return { equalPasswords: true };
      }
      if (value?.[firstKey] === value?.[secondKey]) return null;

      return { equalPasswords: true };
    };
  },
  validateUppercaseLetter(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      const hasUppercase = /[A-Z]/.test(control.value);
      return hasUppercase ? null : { uppercaseLetter: true };
    };
  },

  validateLettersAndNumbers(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      const hasNumbers = /[0-9]+/.test(control.value);
      const hasLetters = /[a-zA-Z]+/.test(control.value);

      if (hasNumbers && hasLetters) {
        return null;
      } else {
        return { lettersAndNumbers: true };
      }
    };
  },

  validateSpecialCharacter(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      const hasSpecialCharacter = /[@$!%*?&]/.test(control.value);
      return hasSpecialCharacter ? null : { specialCharacter: true };
    };
  },

  passwordMatchValidator(control: AbstractControl) {
    const password = control.get('password')!.value;
    const confirmPassword = control.get('confirmPassword')!.value;
    if (password !== confirmPassword) {
      control.get('confirmPassword')!.setErrors({ passwordMismatch: true });
    } else {
      control.get('confirmPassword')!.setErrors(null);
    }
  },
};
