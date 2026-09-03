import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { phoneFormGroup } from './form-group/phone-form-group';
import { TranslateModule } from '@ngx-translate/core';
import { HlmInputDirective } from '../../ui/input/hlm-input.directive';
import { HlmLabelDirective } from '../../ui/label/hlm-label.directive';

@Component({
  selector: 'lib-phone-form-group',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    HlmInputDirective,
    HlmLabelDirective,
  ],
  templateUrl: './phone-form-group.html',
})
export class PhoneFormGroup {
  formGroup = input<FormGroup>(phoneFormGroup());
  defaultCountry = input('br');

  get control(): FormControl | null {
    return this.formGroup().controls['phone'] as FormControl;
  }

  // preferredCountries logic removed as it was specific to the library
}
