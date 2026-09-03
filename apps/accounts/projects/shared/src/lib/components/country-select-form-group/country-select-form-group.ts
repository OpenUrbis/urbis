import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { countrySelectFormGroup } from './form-group/country-select-form-group';
import { countryList } from './country-select-form-group.utils';
import { TranslateModule } from '@ngx-translate/core';
import { HlmInputDirective } from '../../ui/input/hlm-input.directive';
import { HlmLabelDirective } from '../../ui/label/hlm-label.directive';

@Component({
  selector: 'lib-country-select',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    HlmInputDirective,
    HlmLabelDirective,
  ],
  templateUrl: './country-select-form-group.html',
})
export class CountrySelectFormGroup {
  formGroup = input<FormGroup>(countrySelectFormGroup());

  countryList = countryList;
}
