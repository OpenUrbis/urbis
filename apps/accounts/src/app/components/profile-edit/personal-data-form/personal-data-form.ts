import { Component, effect } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ProfileState } from '../../../states/profile/profile.state';

@Component({
  standalone: false,
  selector: 'app-personal-data-form',
  templateUrl: './personal-data-form.html',
  styleUrl: './personal-data-form.scss',
})
export class PersonalDataForm {
  form = new FormGroup({
    firstName: new FormControl('', Validators.required),
    lastName: new FormControl('', Validators.required),
    oldPassword: new FormControl('', Validators.required),
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
    this.profileState.refresh();
  }
}
