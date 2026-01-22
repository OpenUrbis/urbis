import { CommonModule } from '@angular/common';
import { Component, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import {
  lucideChevronLeft,
  lucideChevronRight,
  lucideLoader2,
  lucidePencil,
  lucidePlus,
} from '@ng-icons/lucide';
import { TranslateModule } from '@ngx-translate/core';
import {
  HlmButtonDirective,
  HlmIconComponent,
} from '../../../../projects/shared/src/public-api';
import { PageStructure } from '../../components/page-structure/page-structure';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { OrganizationState } from '../../states/organization/organization.state';
import { UserDataSource } from './users.data-source';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    PageStructure,
    HlmButtonDirective,
    HlmIconComponent,
    StatusBadgeComponent,
    HasPermissionDirective,
  ],
  providers: [
    provideIcons({
      lucidePlus,
      lucidePencil,
      lucideLoader2,
      lucideChevronLeft,
      lucideChevronRight,
    }),
  ],
  templateUrl: './users.html',
})
export class Users {
  onlyTable = input<boolean>(false);
  organizationId = input<undefined | string>(undefined);

  organizationState = inject(OrganizationState);
  dataSource = inject(UserDataSource);

  // Columns are now handled in template, but good to keep track
  displayedColumns = ['name', 'email', 'status', 'actions'];

  showAllTree = false;

  constructor() {
    effect(() => {
      const organizationId = this.organizationId();

      this.dataSource.filterFormGroup
        .get('organizationId')
        ?.setValue(
          organizationId ??
            this.organizationState.selectedOrganization()?.id ??
            undefined,
        );
      this.dataSource.resetAndReload();
    });
  }

  toggleTree() {
    this.showAllTree = !this.showAllTree;
    if (this.showAllTree) {
      this.dataSource.filterFormGroup.get('organizationId')?.setValue(undefined);
    } else {
      this.dataSource.filterFormGroup
        .get('organizationId')
        ?.setValue(
          this.organizationId() ??
            this.organizationState.selectedOrganization()?.id ??
            undefined,
        );
    }
  }

  nextPage() {
    const current = this.dataSource.currentParams();
    if (current.page * current.limit < this.dataSource.totalCount()) {
      this.dataSource.goToPage(current.page + 1);
    }
  }

  prevPage() {
    const current = this.dataSource.currentParams();
    if (current.page > 1) {
      this.dataSource.goToPage(current.page - 1);
    }
  }
}
