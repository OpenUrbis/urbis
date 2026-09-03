import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import {
  lucideCheck,
  lucideChevronLeft,
  lucideChevronRight,
  lucideEye,
  lucideFilter,
  lucidePencil,
  lucidePlus,
  lucideSearch,
  lucideX,
} from '@ng-icons/lucide';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  HlmButtonDirective,
  HlmCardContentDirective,
  HlmCardDirective,
  HlmIconComponent,
  HlmInputDirective,
  LoadingContent,
} from '../../../../projects/shared/src/public-api';
import { PageStructure } from '../../components/page-structure/page-structure';
import { CpfCnpjPipe } from '../../pipes/cpf-cnpj.pipe';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { PermissionState } from '../../states/permission/permission.state';
import { ProfileState } from '../../states/profile/profile.state';
import {
  RepresentationApi,
  type RepresentationStatus,
} from './services/representation-api';

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
    LoadingContent,
  ],
  providers: [
    provideIcons({
      lucidePlus,
      lucideEye,
      lucidePencil,
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
  representationApi = inject(RepresentationApi);
  permissionState = inject(PermissionState);
  profileState = inject(ProfileState);

  items = signal<any[]>([]);
  loading = signal(true);
  total = signal(0);

  searchControl = new FormControl('');
  statusFilter = new FormControl<RepresentationStatus | null>(null);

  page = signal(1);
  limit = signal(10);

  statusOptions = ['PENDING', 'APPROVED', 'REJECTED', 'INFO_REQUESTED', 'INACTIVE'];

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
        this.representationApi.getOverview({
          page: this.page(),
          limit: this.limit(),
          search: this.searchControl.value || undefined,
          status: this.statusFilter.value || undefined,
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
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }


  canApprove(item: any) {
    if (item.requesterId === this.profileState.value()?.id) return false;
    const orgId = item.organizationId || item.organization?.id;
    if (!orgId) return false;
    return this.permissionState.hasPermission({
      id: 'representation:approve',
      organizationId: orgId,
    });
  }

  canReject(item: any) {
    if (item.requesterId === this.profileState.value()?.id) return false;
    const orgId = item.organizationId || item.organization?.id;
    if (!orgId) return false;
    return this.permissionState.hasPermission({
      id: 'representation:reject',
      organizationId: orgId,
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
