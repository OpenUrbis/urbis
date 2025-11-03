import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { UserRoleManager } from './user-role-manager/user-role-manager';
import { RolesManager } from './roles-manager/roles-manager';

@NgModule({
  declarations: [UserRoleManager, RolesManager],
  exports: [UserRoleManager, RolesManager],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
  ],
})
export class RoleManagerModule {}
