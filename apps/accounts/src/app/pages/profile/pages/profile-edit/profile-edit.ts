import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LoadingContent } from '../../../../../../projects/shared/src/public-api';
import { PersonalDataForm } from '../../../../components/profile-edit/personal-data-form/personal-data-form';
import { ChangePasswordForm } from '../../../../components/profile-edit/change-password-form/change-password-form';
import { TwoFactorManager } from '../../../../components/two-factor-manager/two-factor-manager';
import { ProfileState } from '../../../../states/profile/profile.state';
import { TranslateModule } from '@ngx-translate/core';
import { PageStructure } from '../../../../components/page-structure/page-structure';
import { HlmButtonDirective, HlmIconComponent } from '../../../../../../projects/shared/src/public-api';
import { signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideIcons } from '@ng-icons/core';
import { lucideArrowLeft } from '@ng-icons/lucide';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [
    PersonalDataForm,
    ChangePasswordForm,
    LoadingContent,
    RouterModule,
    TwoFactorManager,
    TranslateModule,
    PageStructure,
    HlmButtonDirective,
    HlmIconComponent,
    CommonModule
  ],
  providers: [provideIcons({ lucideArrowLeft })],
  templateUrl: './profile-edit.html',
})
export class ProfileEdit {
  selectedTabIndex = signal(0);
  profileState = inject(ProfileState);
}
