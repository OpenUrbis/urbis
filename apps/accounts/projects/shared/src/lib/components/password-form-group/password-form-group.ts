import { CommonModule } from '@angular/common';
import { Component, input, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { passwordFormGroup } from './form-group/password-form-group';
import { HintError } from './hint-error/hint-error';

@Component({
  selector: 'lib-password-form-group',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    HintError,
  ],
  templateUrl: './password-form-group.html',
  styleUrl: './password-form-group.scss',
})
export class PasswordFormGroup {
  formGroup = input<FormGroup>(passwordFormGroup());

  hidePassword = signal<boolean>(true);
}
