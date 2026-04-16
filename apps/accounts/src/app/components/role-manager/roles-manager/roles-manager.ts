import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Sort } from '@angular/material/sort';
import { HandleRole } from '../dialogs/handle-role/handle-role';
import { IRoleResponse } from '../dto/role.dto';
import { RolesManagerDataSource } from './roles-manager.data-source';

@Component({
  selector: 'app-roles-manager',
  standalone: false,
  templateUrl: './roles-manager.html',
  styleUrl: './roles-manager.scss',
})
export class RolesManager {
  matSnackBar = inject(MatSnackBar);
  dialog = inject(MatDialog);
  dataSource = inject(RolesManagerDataSource);
  displayedColumns = [
    'name',
    // 'description',
    // 'allowedActions',
    'status',
    'actions',
  ];

  // --- MÉTODOS DE CONTROLE ---

  /** Chamado quando o formulário é submetido para aplicar os filtros. */
  applyFilters() {
    // A mudança no valor do formulário já foi capturada pelo AbstractDataSource.
    // Basta resetar a paginação para que a busca seja refeita do zero.
    this.dataSource.resetAndReload();
  }

  /** Chamado quando a paginação Material é alterada. */
  onPageChange(event: PageEvent) {
    this.dataSource.goToPage(event.pageIndex + 1);
    this.dataSource.updatePageSize(event.pageSize);
  }

  /** Chamado quando a ordenação Material é alterada. */
  onSortChange(sort: Sort) {
    if (sort.direction) {
      this.dataSource.updateSort(sort);
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

  editRole(role?: IRoleResponse) {
    const dialogRef = this.dialog.open(HandleRole, {
      data: role,
      minWidth: '90%',
      width:'90%',
      panelClass: 'dialog-lg-content'
    });

    dialogRef.afterClosed().subscribe((value: IRoleResponse | any) => {
      if (value?.id) this.dataSource.resetAndReload();
    });
  }
}
