import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { ProfileEditModule } from '../../../../components/profile-edit/profile-edit.module';
import { ProfileState } from '../../../../states/profile/profile.state';
import { LoadingContent } from '../../../../../../projects/shared/src/public-api';

@Component({
  selector: 'app-profile-edit',
  imports: [
    MatFormFieldModule,
    MatCardModule,
    MatButtonModule,
    MatTabsModule,
    ProfileEditModule,
    LoadingContent,
  ],
  templateUrl: './profile-edit.html',
  styleUrl: './profile-edit.scss',
})
export class ProfileEdit {
  constructor(readonly profileState: ProfileState) {}
}
