import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PageStructure } from '../../components/page-structure/page-structure';
import { OrganizationDataSource } from './organizations.data-source';

@Component({
  selector: 'app-organizations',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressBarModule,
    RouterLink,
    TranslateModule,
    PageStructure,
  ],
  templateUrl: './organizations.html',
  styleUrl: './organizations.scss',
})
export class Organizations {
  dataSource = inject(OrganizationDataSource);
  displayedColumns = ['name', 'description', 'actions'];

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
}
