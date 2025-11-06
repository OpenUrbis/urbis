import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { LoadingContent } from '../../../../projects/shared/src/public-api';
import { PersonalDataForm } from './personal-data-form/personal-data-form';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ChangePasswordForm } from './change-password-form/change-password-form';

@NgModule({
  declarations: [PersonalDataForm, ChangePasswordForm],
  exports: [PersonalDataForm, ChangePasswordForm],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    LoadingContent,
  ],
})
export class ProfileEditModule {}
