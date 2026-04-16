import { Component, computed, effect, inject, output } from '@angular/core';
import { MatRippleModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { LoadingContent } from '../../../../projects/shared/src/public-api';
import { IOrganization } from '../../pages/organizations/dto/organization.dto';
import { OrganizationState } from '../../states/organization/organization.state';

@Component({
  selector: 'app-organization-switcher',
  imports: [MatListModule, MatDividerModule, MatRippleModule, LoadingContent],
  templateUrl: './organization-switcher.html',
  styleUrl: './organization-switcher.scss',
})
export class OrganizationSwitcher {
  selected = output<IOrganization>();

  organizationState = inject(OrganizationState);

  loading = computed(() => this.organizationState.loading());
  organizations = computed(
    () => this.organizationState.value().myOrganizations,
  );

  constructor() {
    effect(() => this.organizationState.refresh());
  }

  select(org: IOrganization) {
    this.organizationState.selectOrganization(org);
    this.selected.emit(org);
  }
}
