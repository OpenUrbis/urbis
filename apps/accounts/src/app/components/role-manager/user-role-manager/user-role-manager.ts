import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { provideIcons } from '@ng-icons/core';
import { lucidePlus, lucideTrash2 } from '@ng-icons/lucide';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, switchMap, tap } from 'rxjs';
import {
  HlmButtonDirective,
  HlmDialogService,
  HlmIconComponent,
  LoadingContent,
} from '../../../../../projects/shared/src/public-api';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { PageStructure } from '../../page-structure/page-structure';
import { AddRole } from '../dialogs/add-role/add-role';
import { IRoleResponse } from '../dto/role.dto';
import { IUserAssigmentResponse } from '../dto/user-assignment.dto';
import { RoleManagerApi } from '../services/role-manager-api';

@Component({
  selector: 'app-user-role-manager',
  standalone: true,
  imports: [
    CommonModule,
    LoadingContent,
    PageStructure,
    TranslateModule,
    HlmButtonDirective,
    HlmIconComponent,
    HasPermissionDirective,
  ],
  providers: [provideIcons({ lucidePlus, lucideTrash2 })],
  templateUrl: './user-role-manager.html',
})
export class UserRoleManager {
  userId = input.required<string>();
  userId$ = new Subject();

  loading = signal<boolean>(false);

  roleManagerApi = inject(RoleManagerApi);
  dialogService = inject(HlmDialogService);

  userRoles = toSignal(
    this.userId$.pipe(
      tap(() => this.loading.set(true)),
      switchMap(() => this.roleManagerApi.getUserRoles(this.userId())),
      tap(() => this.loading.set(false)),
    ),
  );

  userRoleIds = computed(() => {
    return this.userRoles()?.map((role) => role.roleId);
  });

  constructor() {
    effect(() => {
      this.userId$.next(this.userId());
    });
    effect(() => this.userRoles());
  }

  formatPermissions(role: IRoleResponse) {
    return role.rolePermissions
      .map(({ permission }) => permission.name)
      .join(', ');
  }

  rmRole(assign: IUserAssigmentResponse) {
    this.roleManagerApi.unassign(assign.id).subscribe({
      next: () => this.userId$.next(this.userId()),
      error: (err) => console.error(err),
    });
  }

  async openAddRole() {
    const dialogRef = this.dialogService.open(AddRole, {
      data: { userId: this.userId(), roles: this.userRoleIds() },
      width: '500px',
    });

    await dialogRef.afterClosed();
    this.userId$.next(this.userId());
  }
}
