import { Component, effect } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LoadingContent } from '../../../../../../projects/shared/src/public-api';
import { ProfileState } from '../../../../states/profile/profile.state';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-profile-edit',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    LoadingContent,
  ],
  templateUrl: './profile-edit.html',
  styleUrl: './profile-edit.scss',
})
export class ProfileEdit {
  form = new FormGroup({
    firstName: new FormControl('', Validators.required),
    lastName: new FormControl('', Validators.required),
  });

  constructor(readonly profileState: ProfileState) {
    effect(() => {
      if (!profileState.value().id || profileState.loading()) return;

      this.form.patchValue({
        firstName: profileState.value().firstName,
        lastName: profileState.value().lastName,
      });
    });
  }

  submit() {
    console.log('submited');
  }
}
