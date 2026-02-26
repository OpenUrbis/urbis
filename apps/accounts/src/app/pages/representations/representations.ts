import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import {
  lucideCheck,
  lucideEye,
  lucideFilter,
  lucidePlus,
  lucideSearch,
  lucideX,
  lucideChevronLeft,
  lucideChevronRight,
} from '@ng-icons/lucide';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  HlmButtonDirective,
  HlmCardContentDirective,
  HlmCardDirective,
  HlmIconComponent,
  HlmInputDirective,
  HlmToasterService,
  useConfirmDialog,
} from '../../../../projects/shared/src/public-api';
import { PageStructure } from '../../components/page-structure/page-structure';
import { PermissionState } from '../../states/permission/permission.state';
import { ProfileState } from '../../states/profile/profile.state';
import { CpfCnpjPipe } from '../../pipes/cpf-cnpj.pipe';
import { SolicitationApi } from './services/solicitation-api';
import { OrganizationState } from '../../states/organization/organization.state';
import { RolePermissionScopeEnum } from '../../shared/enums/role-permission-scope.enum';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';

interface PermissionOrganizationWithScope {
  organizationId: string;
  scope: RolePermissionScopeEnum;
}

@Component({
  selector: 'app-representations',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    ReactiveFormsModule,
    HlmButtonDirective,
    HlmCardDirective,
    HlmCardContentDirective,
    HlmIconComponent,
    HlmInputDirective,
    PageStructure,
    HasPermissionDirective,
    CpfCnpjPipe,
  ],
  providers: [
    provideIcons({
      lucidePlus,
      lucideEye,
      lucideSearch,
      lucideFilter,
      lucideCheck,
      lucideX,
      lucideChevronLeft,
      lucideChevronRight,
    }),
  ],
  templateUrl: './representations.html',
})
export class Representations implements OnInit {
  solicitationApi = inject(SolicitationApi);
  toaster = inject(HlmToasterService);
  permissionState = inject(PermissionState);
  translate = inject(TranslateService);
  confirm = useConfirmDialog();

  items = signal<any[]>([]);
  loading = signal(true);
  total = signal(0);

  searchControl = new FormControl('');
  statusFilter = new FormControl<string | null>(null);

  page = signal(1);
  limit = signal(10);

  statusOptions = [
    'REPRESENTING',
    'AVAILABLE',
    'PENDING',
    'APPROVED',
    'REJECTED',
    'INFO_REQUESTED',
  ];

  async ngOnInit() {
    this.loadData();

    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.page.set(1);
        this.loadData();
      });

    this.statusFilter.valueChanges.subscribe(() => {
      this.page.set(1);
      this.loadData();
    });
  }

  async loadData() {
    this.loading.set(true);
    try {
      const res: any = await firstValueFrom(
        this.solicitationApi.getOverview({
          page: this.page(),
          limit: this.limit(),
          search: this.searchControl.value || undefined,
          status: this.statusFilter.value
            ? [this.statusFilter.value]
            : undefined,
        }),
      );
      this.items.set(res.data);
      this.total.set(res.total);
    } catch (e) {
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }

  getStatusClass(status: string) {
    switch (status) {
      case 'REPRESENTING':
        return 'bg-emerald-100 text-emerald-800';
      case 'AVAILABLE':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'INFO_REQUESTED':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  async approve(id: string) {
    if (
      !(await this.confirm({
        title: this.translate.instant('representations.detail.buttons.approve'),
        description: this.translate.instant(
          'solicitation.actions.approve.description',
        ),
        confirmText: this.translate.instant(
          'representations.detail.buttons.approve',
        ),
      }))
    )
      return;

    try {
      await firstValueFrom(this.solicitationApi.approve(id));
      await this.loadData();
      this.toaster.success(
        this.translate.instant('solicitation.actions.approve.success'),
      );
    } catch (_e) {
      this.toaster.error(
        this.translate.instant('solicitation.actions.approve.error'),
      );
    }
  }

  async reject(id: string) {
    if (
      !(await this.confirm({
        title: this.translate.instant('representations.detail.buttons.reject'),
        description: this.translate.instant(
          'solicitation.actions.reject.description',
        ),
        confirmText: this.translate.instant(
          'representations.detail.buttons.reject',
        ),
        confirmColor: 'warn',
      }))
    )
      return;

    try {
      await firstValueFrom(this.solicitationApi.reject(id));
      await this.loadData();
      this.toaster.success(
        this.translate.instant('solicitation.actions.reject.success'),
      );
    } catch (_e) {
      this.toaster.error(
        this.translate.instant('solicitation.actions.reject.error'),
      );
    }
  }

  canApprove(item: any) {
    if (!item.organizationId) return false;
    return this.permissionState.hasPermission({
      id: 'solicitation:approve',
      organizationId: item.organizationId,
    });
  }

  canReject(item: any) {
    if (!item.organizationId) return false;
    return this.permissionState.hasPermission({
      id: 'solicitation:reject',
      organizationId: item.organizationId,
    });
  }

  nextPage() {
    if (this.page() * this.limit() < this.total()) {
      this.page.update((p) => p + 1);
      this.loadData();
    }
  }

  prevPage() {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this.loadData();
    }
  }
}
