import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { HlmButtonDirective } from '../../../../../../projects/shared/src/public-api';
import { UserFormComponent } from '../../../../components/user-form/user-form';

@Component({
  selector: 'app-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    HlmButtonDirective,
    UserFormComponent,
  ],
  templateUrl: './password.component.html',
})
export class PasswordComponent {
  @Input({ required: true }) formGroup!: FormGroup;

  @Output() submit = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();
}
