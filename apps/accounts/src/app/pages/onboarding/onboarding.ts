import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { LoadingContent } from '../../../../projects/shared/src/public-api';
import { CreateOrganization } from '../../components/create-organization/create-organization';
import { OrganizationSwitcher } from '../../components/organization-switcher/organization-switcher';
import { OrganizationState } from '../../states/organization/organization.state';
import { IOrganization } from '../organizations/dto/organization.dto';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';
import { ProfileState } from '../../states/profile/profile.state';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-onboarding',
  imports: [
    LoadingContent,
    OrganizationSwitcher,
    CreateOrganization,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    NgClass,
    TranslateModule,
  ],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.scss',
})
export class Onboarding {
  step = signal<number>(0);
  loading = signal<boolean>(false);

  organizationState = inject(OrganizationState);
  profileState = inject(ProfileState);
  router = inject(Router);

  name = computed(() => this.profileState.value()?.firstName)

  constructor() {
    effect(() => {
      const selectedOrganization =
        this.organizationState.selectedOrganization();
      if (selectedOrganization) this.goToDashboard();
    });

    effect(() => {
      const organizations = this.organizationState.value().myOrganizations;
      if (organizations.length === 1)
        this.organizationState.selectOrganization(organizations[0]);
      else if (organizations.length > 1) this.step.set(1);
    });
  }

  selectOrganization(org: IOrganization) {
    this.organizationState.selectOrganization(org);
  }

  goToDashboard() {
    this.router.navigate(['/'], { replaceUrl: true });
  }
}
