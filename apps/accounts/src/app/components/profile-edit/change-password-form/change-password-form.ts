import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ProfileState } from '../../../states/profile/profile.state';

@Component({
  standalone: false,
  selector: 'app-change-password-form',
  templateUrl: './change-password-form.html',
  styleUrl: './change-password-form.scss',
})
export class ChangePasswordForm {
  form = new FormGroup({
    oldPassword: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
    repeatPassword: new FormControl('', Validators.required),
  });

  constructor(readonly profileState: ProfileState) {}

  submit() {
    console.log('submited');
    this.profileState.refresh();
  }
}
