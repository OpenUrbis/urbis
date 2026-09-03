import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { LoadingContent } from '../../../../projects/shared/src/public-api';
import { IOrganization } from '../../pages/organizations/dto/organization.dto';
import { OrganizationState } from '../../states/organization/organization.state';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-organization-switcher',
  standalone: true,
  imports: [LoadingContent, CommonModule],
  templateUrl: './organization-switcher.html',
})
export class OrganizationSwitcher {
  selected = output<IOrganization>();
  disableAutoSelect = input<boolean>(false);
  activeSelection = signal<string | null>(null);

  organizationState = inject(OrganizationState);

  loading = computed(() => this.organizationState.loading());
  organizations = computed(
    () => this.organizationState.value().myOrganizations,
  );

  constructor() {
    effect(() => this.organizationState.refresh());
  }

  select(org: IOrganization) {
    if (this.disableAutoSelect()) {
      this.activeSelection.set(org.id);
      this.selected.emit(org);
    } else {
      this.organizationState.selectOrganization(org);
      this.selected.emit(org);
    }
  }
}
