import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { countrySelectFormGroup } from './form-group/country-select-form-group';
import { countryList } from './country-select-form-group.utils';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'lib-country-select',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatFormFieldModule,
    TranslateModule,
  ],
  templateUrl: './country-select-form-group.html',
  styleUrl: './country-select-form-group.scss',
})
export class CountrySelectFormGroup {
  formGroup = input<FormGroup>(countrySelectFormGroup());

  countryList = countryList;
}
