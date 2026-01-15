import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PageStructure } from '../../components/page-structure/page-structure';
import { OrganizationDataSource } from './organizations.data-source';
import { HlmButtonDirective, HlmIconComponent } from '../../../../projects/shared/src/public-api';
import { provideIcons } from '@ng-icons/core';
import { lucidePlus, lucidePencil, lucideLoader2, lucideChevronLeft, lucideChevronRight } from '@ng-icons/lucide';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-organizations',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    PageStructure,
    HlmButtonDirective,
    HlmIconComponent
  ],
  providers: [provideIcons({ lucidePlus, lucidePencil, lucideLoader2, lucideChevronLeft, lucideChevronRight })],
  templateUrl: './organizations.html',
})
export class Organizations {
  dataSource = inject(OrganizationDataSource);
  displayedColumns = ['name', 'description', 'actions'];

  constructor() {
      this.dataSource.resetAndReload();
  }

  nextPage() {
    const current = this.dataSource.currentParams();
    if (current.page * current.limit < this.dataSource.totalCount()) {
      this.dataSource.goToPage(current.page + 1);
    }
  }

  prevPage() {
    const current = this.dataSource.currentParams();
    if (current.page > 1) {
      this.dataSource.goToPage(current.page - 1);
    }
  }
}
