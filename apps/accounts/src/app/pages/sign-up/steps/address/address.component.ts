import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  HlmButtonDirective,
} from '../../../../../../projects/shared/src/public-api';
import { UserFormComponent } from '../../../../components/user-form/user-form';

@Component({
  selector: 'app-address',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    HlmButtonDirective,
    UserFormComponent,
  ],
  templateUrl: './address.component.html',
})
export class AddressComponent {
  @Input({ required: true }) formGroup!: FormGroup;
  @Input() noOfficialAddress = false;

  @Output() next = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();
  @Output() noOfficialAddressChange = new EventEmitter<boolean>();
}
