import { Component, computed, effect, inject, output } from '@angular/core';
import { LoadingContent } from '../../../../projects/shared/src/public-api';
import { IOrganization } from '../../pages/organizations/dto/organization.dto';
import { OrganizationState } from '../../states/organization/organization.state';

@Component({
  selector: 'app-organization-switcher',
  standalone: true,
  imports: [LoadingContent],
  templateUrl: './organization-switcher.html',
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
