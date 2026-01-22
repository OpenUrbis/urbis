import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
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
import { OrganizationSelector } from '../../../../components/organization-selector/organization-selector';
import { PageStructure } from '../../../../components/page-structure/page-structure';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { Users } from '../../../users/users';
import {
  IOrganization,
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
    OrganizationSelector,
  ],
  providers: [provideIcons({ lucideArrowLeft, lucideTrash2, lucideLoader2 })],
  templateUrl: './handle-organization.html',
})
export class HandleOrganization {
  form = new FormGroup({
    name: new FormControl('', Validators.required),
    description: new FormControl(''),
    parent: new FormControl<IOrganization | null>(null),
  });

  id = signal<string | undefined>(undefined);
  name = signal<string | undefined>(undefined);
  loading = signal<boolean>(false);
  loadingSave = signal<boolean>(false);
  selectedTab = signal<number>(0);

  toaster = inject(HlmToasterService);
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  organizationApi = inject(OrganizationsApi);
  translate = inject(TranslateService);

  constructor() {
    effect(() => {
      this.activatedRoute.params
        .pipe(
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
        .subscribe(async (organization) => {
          if (organization) {
            this.name.set(organization.name);

            this.form.patchValue({
              name: organization.name,
              description: organization.description,
            });

            if (organization.parentId) {
              try {
                const parent = await firstValueFrom(
                  this.organizationApi.get(organization.parentId),
                );
                this.form.patchValue({ parent });
              } catch (e) {
                console.error('Failed to load parent organization', e);
              }
            }
          }
        });
    });
  }

  async save() {
    if (this.form.invalid) return;

    const formValue = this.form.value;
    const parent = formValue.parent;

    const data: IRequestCreateOrganization | IRequestUpdateOrganization = {
      name: formValue.name!,
      description: formValue.description!,
      parentId: parent?.id,
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
