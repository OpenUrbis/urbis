import { Component, computed, effect, inject, signal } from '@angular/core';
import {
  HlmCardDirective,
  HlmCardContentDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
  HlmIconComponent,
  LoadingContent,
} from '../../../../projects/shared/src/public-api';
import { Router, RouterModule } from '@angular/router';
import { CreateOrganization } from '../../components/create-organization/create-organization';
import { OrganizationState } from '../../states/organization/organization.state';
import { IOrganization } from '../organizations/dto/organization.dto';
import { CommonModule } from '@angular/common';
import { ProfileState } from '../../states/profile/profile.state';
import { AuthState } from '../../states/auth/auth.state';
import { TranslateModule } from '@ngx-translate/core';
import { provideIcons } from '@ng-icons/core';
import { lucideLoader2 } from '@ng-icons/lucide';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LoadingContent,
    CreateOrganization,
    HlmCardDirective,
    HlmCardContentDirective,
    HlmCardHeaderDirective,
    HlmCardTitleDirective,
    HlmIconComponent,
    TranslateModule,
  ],
  providers: [provideIcons({ lucideLoader2 })],
  templateUrl: './onboarding.html',
})
export class Onboarding {
  authState = inject(AuthState);
  organizationState = inject(OrganizationState);
  profileState = inject(ProfileState);
  router = inject(Router);

  name = computed(() => this.profileState.value()?.firstName);

  isLoading = computed(() => 
    !this.authState.isAuthenticated() ||
    this.profileState.loading() || 
    this.organizationState.loading()
  );

  hasOrganizations = computed(() => 
    this.organizationState.value().myOrganizations.length > 0
  );

  constructor() {
    this.profileState.refresh();
    this.organizationState.refresh();
    
    effect(() => {
      const selectedOrganization =
        this.organizationState.selectedOrganization();
      if (selectedOrganization) {
        this.goToDashboard();
      } else if (this.hasOrganizations() && !this.organizationState.loading()) {
        // If has organizations but none selected, select first
        const orgs = this.organizationState.value().myOrganizations;
        this.organizationState.selectOrganization(orgs[0]);
      }
    });
  }

  selectOrganization(org: IOrganization) {
    this.organizationState.selectOrganization(org);
  }

  goToDashboard() {
    this.router.navigate(['/'], { replaceUrl: true });
  }

  retry() {
    this.profileState.refresh();
    this.organizationState.refresh();
  }
}
