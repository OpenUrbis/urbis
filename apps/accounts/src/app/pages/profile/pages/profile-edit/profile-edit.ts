import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterModule } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { LoadingContent } from '../../../../../../projects/shared/src/public-api';
import { ProfileEditModule } from '../../../../components/profile-edit/profile-edit.module';
import { TwoFactorManager } from '../../../../components/two-factor-manager/two-factor-manager';
import { ProfileState } from '../../../../states/profile/profile.state';
import { TranslateModule } from '@ngx-translate/core';
import { PageStructure } from '../../../../components/page-structure/page-structure';

@Component({
  selector: 'app-profile-edit',
  imports: [
    MatFormFieldModule,
    MatCardModule,
    MatButtonModule,
    MatTabsModule,
    ProfileEditModule,
    LoadingContent,
    MatIconModule,
    RouterModule,
    TwoFactorManager,
    TranslateModule,
    PageStructure,
  ],
  providers: [provideNoopAnimations()],
  templateUrl: './profile-edit.html',
  styleUrl: './profile-edit.scss',
})
export class ProfileEdit {
  selectedTabIndex = 0;
  profileState = inject(ProfileState);
}
