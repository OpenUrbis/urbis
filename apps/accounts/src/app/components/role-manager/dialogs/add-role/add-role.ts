import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
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
import { debounceTime, startWith, switchMap } from 'rxjs';
import { IRoleResponse } from '../../dto/role.dto';
import { RoleManagerApi } from '../../services/role-manager-api';

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
  ],
  templateUrl: './add-role.html',
  styleUrl: './add-role.scss',
})
export class AddRole {
  searchRole = new FormControl();

  roleManagerApi = inject(RoleManagerApi);
  readonly dialogRef = inject(MatDialogRef<AddRole>);
  readonly data = inject<{ userId: string; roles: string[] }>(MAT_DIALOG_DATA);

  result$ = this.searchRole.valueChanges.pipe(
    startWith(''),
    debounceTime(300),
    switchMap((search) => this.roleManagerApi.listRoles({ search })),
  );

  constructor() {
    console.log(this.data);
  }

  addRole(event: Event, role: IRoleResponse) {
    event.stopImmediatePropagation();
    this.roleManagerApi
      .assign({ userId: this.data.userId, roleId: role.id })
      .subscribe({
        next: (result) => {
          this.data.roles.push(result.roleId);
        },
        error: (err) => console.error(err),
      });
  }
}
