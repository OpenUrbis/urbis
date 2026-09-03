import { FormControl, FormGroup, Validators } from '@angular/forms';

interface PhoneFormOptions {
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
}

export const phoneFormGroup = ({
  defaultValue = '',
  required = true,
  disabled = false,
}: PhoneFormOptions = {}) =>
  new FormGroup({
    phone: new FormControl({ value: defaultValue, disabled }, [
      required ? Validators.required : Validators.nullValidator,
    ]),
  });
