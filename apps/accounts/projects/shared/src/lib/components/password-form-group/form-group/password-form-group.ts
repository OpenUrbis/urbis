import { FormControl, FormGroup, Validators } from '@angular/forms';
import { PasswordValidator } from '../validators/password-validator';

export const passwordFormGroup = () =>
  new FormGroup(
    {
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(8),
        PasswordValidator.validateUppercaseLetter(),
        PasswordValidator.validateLettersAndNumbers(),
      ]),
      confirmPassword: new FormControl('', [
        Validators.required,
        Validators.minLength(8),
        PasswordValidator.validateUppercaseLetter(),
        PasswordValidator.validateLettersAndNumbers(),
      ]),
    },
    PasswordValidator.equalPasswords('password', 'confirmPassword'),
  );
