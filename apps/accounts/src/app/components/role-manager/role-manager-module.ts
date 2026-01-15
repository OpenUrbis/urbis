import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { LoadingContent } from '../../../../projects/shared/src/public-api';
import { RolesManager } from './roles-manager/roles-manager';
import { UserRoleManager } from './user-role-manager/user-role-manager';
import { TranslateModule } from '@ngx-translate/core';
import { PageStructure } from '../page-structure/page-structure';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';

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
    MatCardModule,
    MatProgressBarModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    LoadingContent,
    TranslateModule,
    PageStructure,
    HasPermissionDirective,
  ],
})
export class RoleManagerModule {}
