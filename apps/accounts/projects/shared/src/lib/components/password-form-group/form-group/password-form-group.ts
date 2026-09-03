import { FormControl, FormGroup, Validators } from '@angular/forms';
import { PasswordValidator } from '../validators/password-validator';

export const passwordFormGroup = () =>
  new FormGroup(
    {
      password: new FormControl('', {
        validators: [
          Validators.required,
          Validators.minLength(8),
          PasswordValidator.validateUppercaseLetter(),
          PasswordValidator.validateLettersAndNumbers(),
        ],
        nonNullable: true,
      }),
      confirmPassword: new FormControl('', {
        validators: [
          Validators.required,
          Validators.minLength(8),
          PasswordValidator.validateUppercaseLetter(),
          PasswordValidator.validateLettersAndNumbers(),
        ],
        nonNullable: true,
      }),
    },
    PasswordValidator.equalPasswords('password', 'confirmPassword'),
  );
