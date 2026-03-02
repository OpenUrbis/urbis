import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, startWith, switchMap, tap } from 'rxjs';
import { PermissionScopePipe } from '../../../../pipes/permission-scope-pipe';
import { IRoleResponse } from '../../dto/role.dto';
import { RoleManagerApi } from '../../services/role-manager-api';
import { LoadingContent } from '../../../../../../projects/shared/src/public-api';

@Component({
  selector: 'app-add-role',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatButtonModule,
    MatExpansionModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    PermissionScopePipe,
    LoadingContent
  ],
  templateUrl: './add-role.html',
  styleUrl: './add-role.scss',
})
export class AddRole {
  searchRole = new FormControl();

  loading = signal<boolean>(false);

  matSnackBar = inject(MatSnackBar);
  roleManagerApi = inject(RoleManagerApi);
  readonly dialogRef = inject(MatDialogRef<AddRole>);
  readonly data = inject<{ userId: string; roles: string[] }>(MAT_DIALOG_DATA);

  result$ = this.searchRole.valueChanges.pipe(
    startWith(''),
    debounceTime(300),
    tap(() => this.loading.set(true)),
    switchMap((search) => this.roleManagerApi.listRoles({ search })),
    tap(() => this.loading.set(false)),
  );

  addRole(event: Event, role: IRoleResponse) {
    event.stopImmediatePropagation();
    this.roleManagerApi
      .assign({ userId: this.data.userId, roleId: role.id })
      .subscribe({
        next: (result) => {
          this.data.roles.push(result.roleId);
        },
        error: (err) => {
          this.matSnackBar.open(
            'Houve um erro ao tentar adicionar o cargo ao usuário',
          );
          console.error(err);
        },
      });
  }
}
