import { Component, effect } from '@angular/core';
import { ProfileState } from '../../states/profile/profile.state';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { LoadingContent } from '../../../../projects/shared/src/public-api';

@Component({
  selector: 'app-profile',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    LoadingContent,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  form = new FormGroup({
    firstName: new FormControl({ value: '', disabled: true }),
    lastName: new FormControl({ value: '', disabled: true }),
    email: new FormControl({ value: '', disabled: true }),
  });

  constructor(readonly profileState: ProfileState) {
    profileState.refresh();
    effect(() => {
      if (!profileState.value().id || profileState.loading()) return;

      this.form.patchValue({
        email: profileState.value().email,
        firstName: profileState.value().firstName,
        lastName: profileState.value().lastName,
      });
    });
  }
}
