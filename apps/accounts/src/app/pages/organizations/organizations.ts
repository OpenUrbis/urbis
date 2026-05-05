import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import {
  lucideChevronLeft,
  lucideChevronRight,
  lucideLoader2,
  lucidePencil,
  lucidePlus,
} from '@ng-icons/lucide';
import { TranslateModule } from '@ngx-translate/core';
import {
  HlmButtonDirective,
  HlmIconComponent,
} from '../../../../projects/shared/src/public-api';
import { PageStructure } from '../../components/page-structure/page-structure';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { OrganizationDataSource } from './organizations.data-source';

@Component({
  selector: 'app-organizations',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    PageStructure,
    HlmButtonDirective,
    HlmIconComponent,
    HasPermissionDirective,
  ],
  providers: [
    provideIcons({
      lucidePlus,
      lucidePencil,
      lucideLoader2,
      lucideChevronLeft,
      lucideChevronRight,
    }),
  ],
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
