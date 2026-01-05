import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { Subject, switchMap, tap } from 'rxjs';
import { AddRole } from '../dialogs/add-role/add-role';
import { IRoleResponse } from '../dto/role.dto';
import { IUserAssigmentResponse } from '../dto/user-assignment.dto';
import { RoleManagerApi } from '../services/role-manager-api';

@Component({
  selector: 'app-user-role-manager',
  standalone: false,
  templateUrl: './user-role-manager.html',
  styleUrl: './user-role-manager.scss',
})
export class UserRoleManager {
  userId = input.required<string>();
  userId$ = new Subject();

  loading = signal<boolean>(false);

  roleManagerApi = inject(RoleManagerApi);
  dialog = inject(MatDialog);

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
    effect(() => this.userId$.next(this.userId()));
  }

  formatPermissions(role: IRoleResponse) {
    return role.rolePermissions
      .map(({ permission }) => permission.name)
      .join(', ');
  }

  rmRole(assign: IUserAssigmentResponse) {
    // TO DO: Loading e feedback pro usuário
    this.roleManagerApi
      .unassign(assign.id)
      .subscribe({
        next: () => this.userId$.next(this.userId()),
        error: (err) => console.error(err),
      });
  }

  openAddRole() {
    const dialogRef = this.dialog.open(AddRole, {
      data: { userId: this.userId(), roles: this.userRoleIds() },
    });

    dialogRef.afterClosed().subscribe(() => this.userId$.next(this.userId()));
  }
}
