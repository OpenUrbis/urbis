import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
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
  HlmInputDirective,
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
    HlmInputDirective,
    HasPermissionDirective,
    ReactiveFormsModule,
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
  displayedColumns = [
    'name',
    'document',
    'description',
    'userCount',
    'status',
    'actions',
  ];

  typeOptions = [
    ['fisica_capaz', 'Pessoa física capaz'],
    ['fisica_emancipada', 'Pessoa física capaz (emancipada)'],
    [
      'fisica_assistido_parental',
      'Pessoa física assistida por autoridade parental',
    ],
    ['fisica_assistido_tutor', 'Pessoa física assistida por tutor'],
    ['espolio', 'Espólio'],
    ['heranca', 'Herança jacente ou vacante'],
    ['juridica', 'Pessoa jurídica'],
    ['massa_falida', 'Massa falida'],
    ['massa_insolvente', 'Massa do insolvente civil'],
    ['condominio', 'Condomínio edilício'],
  ];

  get searchControl() {
    return this.dataSource.filterFormGroup.get('search') as FormControl;
  }

  get typeControl() {
    return this.dataSource.filterFormGroup.get('type') as FormControl;
  }

  get statusControl() {
    return this.dataSource.filterFormGroup.get('status') as FormControl;
  }

  description(organization: any): string {
    if (organization.representedType) return organization.representedType;
    const registrationType = this.typeOptions.find(
      ([value]) => value === organization.registrationType,
    );
    return (
      registrationType?.[1] ||
      organization.description?.replace(/^Sua conta -\s*/, '') ||
      '—'
    );
  }

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
