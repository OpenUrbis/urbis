import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { startWith, Subject, switchMap, tap } from 'rxjs';
import { IPagination } from '../../../shared/dto/pagination.dto';
import { HandleRole } from '../dialogs/handle-role/handle-role';
import { IRoleResponse } from '../dto/role.dto';
import { RoleManagerApi } from '../services/role-manager-api';

@Component({
  selector: 'app-roles-manager',
  standalone: false,
  templateUrl: './roles-manager.html',
  styleUrl: './roles-manager.scss',
})
export class RolesManager {
  pagination$ = new Subject<IPagination>();
  loading = signal<boolean>(false);

  roleManagerApi = inject(RoleManagerApi);
  dialog = inject(MatDialog);

  roles = toSignal(
    // TO DO: Paginação das roles
    this.pagination$.pipe(
      startWith({ page: 0, limit: 10 }),
      tap(() => this.loading.set(true)),
      switchMap((pagination) => this.roleManagerApi.listRoles(pagination)),
      tap(() => this.loading.set(false)),
    ),
  );

  createRole() {
    this.editRole();
  }

  formatPermissions(role: IRoleResponse) {
    return role.rolePermissions.map(({permission}) => permission.name).join(', ');
  }

  editRole(role?: IRoleResponse) {
    const dialogRef = this.dialog.open(HandleRole, {
      data: role,
      width: '90%',
    });

    dialogRef.afterClosed().subscribe((value: IRoleResponse | any) => {
      if (value?.id) this.pagination$.next({ page: 0, limit: 10 });
    });
  }
}
