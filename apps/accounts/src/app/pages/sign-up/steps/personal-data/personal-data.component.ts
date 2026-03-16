import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  HlmButtonDirective,
  HlmIconComponent,
  SignInGovBrBtn,
} from '../../../../../../projects/shared/src/public-api';
import { UserFormComponent } from '../../../../components/user-form/user-form';

@Component({
  selector: 'app-personal-data',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    HlmButtonDirective,
    HlmIconComponent,
    SignInGovBrBtn,
    UserFormComponent,
  ],
  templateUrl: './personal-data.component.html',
})
export class PersonalDataComponent {
  @Input({ required: true }) formGroup!: FormGroup;
  @Input() hasGovBrData = false;

  @Output() next = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();
  @Output() govBrLogin = new EventEmitter<void>();
}
