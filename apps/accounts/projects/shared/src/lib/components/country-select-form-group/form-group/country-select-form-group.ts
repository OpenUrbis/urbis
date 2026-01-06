import { FormControl, FormGroup, Validators } from '@angular/forms';

interface CountrySelectFormOptions {
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
}

export const countrySelectFormGroup = ({
  defaultValue = 'BR',
  required = true,
  disabled = false,
}: CountrySelectFormOptions = {}) =>
  new FormGroup({
    country: new FormControl({ value: defaultValue, disabled }, [
      required ? Validators.required : Validators.nullValidator,
    ]),
  });
