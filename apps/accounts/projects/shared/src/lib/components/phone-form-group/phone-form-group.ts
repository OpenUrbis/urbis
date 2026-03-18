import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { NgxMatInputTelComponent } from 'ngx-mat-input-tel';
import { phoneFormGroup } from './form-group/phone-form-group';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'lib-phone-form-group',
  imports: [
    CommonModule,
    MatInputModule,
    NgxMatInputTelComponent,
    ReactiveFormsModule,
    TranslateModule,
  ],
  templateUrl: './phone-form-group.html',
  styleUrl: './phone-form-group.scss',
})
export class PhoneFormGroup {
  formGroup = input<FormGroup>(phoneFormGroup());
  defaultCountry = input('br');

  get control(): FormControl | null {
    return this.formGroup().controls['phone'] as FormControl;
  }

  preferredCountries = computed<any>(() => {
    if (
      this.defaultCountry() === 'br' ||
      this.defaultCountry() === 'us' ||
      !this.defaultCountry()
    ) {
      return ['br', 'us'];
    }
    return [this.defaultCountry(), 'br', 'us'].filter(
      (country) => country !== undefined,
    );
  });
}
