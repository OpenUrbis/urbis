import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideLoader2, lucideTrash2 } from '@ng-icons/lucide';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { catchError, firstValueFrom, of, switchMap, tap } from 'rxjs';
import {
  HlmButtonDirective,
  HlmCardDirective,
  HlmIconComponent,
  HlmInputDirective,
  HlmLabelDirective,
  HlmToasterService,
  LoadingContent,
} from '../../../../../../projects/shared/src/public-api';
import { PageStructure } from '../../../../components/page-structure/page-structure';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { Users } from '../../../users/users';
import {
  IRequestCreateOrganization,
  IRequestUpdateOrganization,
} from '../../dto/organization.dto';
import { OrganizationsApi } from '../../services/organizations-api';

@Component({
  selector: 'app-handle-organization',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    RouterLink,
    LoadingContent,
    Users,
    TranslateModule,
    PageStructure,
    HlmButtonDirective,
    HlmCardDirective,
    HlmInputDirective,
    HlmLabelDirective,
    HlmIconComponent,
    HasPermissionDirective,
  ],
  providers: [provideIcons({ lucideArrowLeft, lucideTrash2, lucideLoader2 })],
  templateUrl: './handle-organization.html',
})
export class HandleOrganization {
  form = new FormGroup({
    name: new FormControl('', Validators.required),
    description: new FormControl(''),
    isActive: new FormControl(true),
    dailyLimit: new FormControl(1000, [Validators.required, Validators.min(0)]),
  });

  id = signal<string | undefined>(undefined);
  name = signal<string | undefined>(undefined);
  loading = signal<boolean>(false);
  loadingSave = signal<boolean>(false);
  selectedTab = signal<number>(0);
  loadedMetadata: any = {};

  toaster = inject(HlmToasterService);
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  organizationApi = inject(OrganizationsApi);
  translate = inject(TranslateService);

  constructor() {
    this.activatedRoute.params
      .pipe(
        takeUntilDestroyed(),
        tap(() => this.loading.set(true)),
        switchMap(({ id }) => {
          if (id) {
            this.id.set(id);
            return this.organizationApi.get(id).pipe(
              catchError((err) => {
                console.error(err);
                this.toaster.error('Houve um erro ao carregar a organização');
                this.router.navigate(['/organizations']);
                return of(undefined);
              }),
            );
          } else return of(undefined);
        }),
        tap(() => this.loading.set(false)),
      )
      .subscribe((organization) => {
        if (organization) {
          this.name.set(organization.name);
          this.loadedMetadata = organization.metadata || {};

          this.form.patchValue({
            name: organization.name,
            description: organization.description,
            isActive: organization.metadata?.isActive !== false,
            dailyLimit: organization.metadata?.dailyLimit ?? 1000,
          });
        }
      });
  }

  async save() {
    if (this.form.invalid) return;

    const val = this.form.value;
    const data: any = {
      name: val.name,
      description: val.description,
      metadata: {
        ...(this.loadedMetadata || {}),
        isActive: val.isActive,
        dailyLimit: val.dailyLimit,
      },
    };
    const id = this.id();

    try {
      this.loadingSave.set(true);
      const response = await firstValueFrom(
        id
          ? this.organizationApi.update(id!, data)
          : this.organizationApi.create(data as IRequestCreateOrganization),
      );

      if (!id) {
        this.router.navigate(['/organizations/edit', response?.id]);
      }

      this.toaster.success(
        `Organização ${id ? 'atualizada' : 'criada'} com sucesso`,
      );
    } catch (error) {
      console.error(error);
      this.toaster.error(
        `Houve um erro ao ${id ? 'atualizar' : 'criar'} a organização`,
      );
    } finally {
      this.loadingSave.set(false);
    }
  }
}
