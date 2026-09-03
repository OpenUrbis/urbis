import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  lucideChevronLeft,
  lucideChevronRight,
  lucideLoader2,
  lucidePencil,
  lucidePlus,
  lucideLock,
  lucideTrash2,
} from '@ng-icons/lucide';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  HlmButtonDirective,
  HlmDialogService,
  HlmIconComponent,
  HlmToasterService,
} from '../../../../../projects/shared/src/public-api';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { PageStructure } from '../../page-structure/page-structure';
import { StatusBadgeComponent } from '../../status-badge/status-badge.component';
import { HandleRole } from '../dialogs/handle-role/handle-role';
import { IRoleResponse } from '../dto/role.dto';
import { RolesManagerDataSource } from './roles-manager.data-source';
import { RoleManagerApi } from '../services/role-manager-api';
import { formatRolePermissions } from '../../../shared/utils/permission-formatter';

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
      lucideLock,
      lucideLoader2,
      lucideChevronLeft,
      lucideChevronRight,
      lucideTrash2,
    }),
  ],
  templateUrl: './roles-manager.html',
})
export class RolesManager {
  dialogService = inject(HlmDialogService);
  dataSource = inject(RolesManagerDataSource);
  roleManagerApi = inject(RoleManagerApi);
  toaster = inject(HlmToasterService);
  translate = inject(TranslateService);

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
    return formatRolePermissions(role.rolePermissions);
  }

  async editRole(role?: IRoleResponse) {
    const dialogRef = this.dialogService.open(HandleRole, {
      data: role,
      width: '90%',
    });

    const value = (await dialogRef.afterClosed()) as IRoleResponse | undefined;
    if (value?.id) this.dataSource.resetAndReload();
  }

  deleteRole(role: IRoleResponse) {
    const confirmMessage = this.translate.instant(
      'pages.roles.page.buttons.delete.confirm',
      { name: role.name },
    );
    if (confirm(confirmMessage)) {
      this.roleManagerApi.delete(role.id).subscribe({
        next: (res) => {
          if (res) {
            this.toaster.success(
              this.translate.instant(
                'components.roleManager.handleRole.success.deleted',
              ),
            );
            this.dataSource.resetAndReload();
          }
        },
      });
    }
  }
}
