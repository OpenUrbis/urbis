import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { LoadingContent } from '../../../../projects/shared/src/public-api';
import { RolesManager } from './roles-manager/roles-manager';
import { UserRoleManager } from './user-role-manager/user-role-manager';

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
    LoadingContent,
  ],
})
export class RoleManagerModule {}
