import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { LoadingContent } from '../../../../../../projects/shared/src/public-api';
import { PersonalDataForm } from '../../../../components/profile-edit/personal-data-form/personal-data-form';
import { ChangePasswordForm } from '../../../../components/profile-edit/change-password-form/change-password-form';
import { TwoFactorManager } from '../../../../components/two-factor-manager/two-factor-manager';
import { ProfileState } from '../../../../states/profile/profile.state';
import { TranslateModule } from '@ngx-translate/core';
import {
  HlmButtonDirective,
  HlmIconComponent,
} from '../../../../../../projects/shared/src/public-api';
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
    HlmButtonDirective,
    HlmIconComponent,
    CommonModule,
  ],
  providers: [provideIcons({ lucideArrowLeft })],
  templateUrl: './profile-edit.html',
})
export class ProfileEdit implements OnInit, OnDestroy {
  selectedTabIndex = signal(0);
  profileState = inject(ProfileState);
  private route = inject(ActivatedRoute);
  private sub?: Subscription;

  ngOnInit() {
    this.sub = this.route.queryParams.subscribe((params) => {
      const tab = params['tab'];
      if (tab === 'password') {
        this.selectedTabIndex.set(1);
      } else if (tab === 'two-factor') {
        this.selectedTabIndex.set(2);
      } else {
        this.selectedTabIndex.set(0);
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
