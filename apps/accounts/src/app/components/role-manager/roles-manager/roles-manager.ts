import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
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
  HlmDialogService,
  HlmIconComponent,
} from '../../../../../projects/shared/src/public-api';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { PageStructure } from '../../page-structure/page-structure';
import { StatusBadgeComponent } from '../../status-badge/status-badge.component';
import { HandleRole } from '../dialogs/handle-role/handle-role';
import { IRoleResponse } from '../dto/role.dto';
import { RolesManagerDataSource } from './roles-manager.data-source';

@Component({
  selector: 'app-roles-manager',
  standalone: true,
  imports: [
    CommonModule,
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
  templateUrl: './roles-manager.html',
})
export class RolesManager {
  dialogService = inject(HlmDialogService);
  dataSource = inject(RolesManagerDataSource);

  displayedColumns = ['name', 'status', 'actions'];

  constructor() {
    this.dataSource.resetAndReload();
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

  createRole() {
    this.editRole();
  }

  formatPermissions(role: IRoleResponse) {
    return role.rolePermissions
      .map(({ permission }) => permission?.name)
      .join(', ');
  }

  async editRole(role?: IRoleResponse) {
    const dialogRef = this.dialogService.open(HandleRole, {
      data: role,
      width: '90%',
    });

    const value = (await dialogRef.afterClosed()) as IRoleResponse | undefined;
    if (value?.id) this.dataSource.resetAndReload();
  }
}
