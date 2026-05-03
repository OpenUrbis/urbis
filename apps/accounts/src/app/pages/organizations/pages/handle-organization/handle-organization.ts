import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, firstValueFrom, of, switchMap, tap } from 'rxjs';
import {
  LoadingButton,
  LoadingContent,
  HlmToasterService
} from '../../../../../../projects/shared/src/public-api';
import {
  HlmButtonDirective,
  HlmCardDirective,
  HlmInputDirective,
  HlmLabelDirective,
  HlmIconComponent
} from '../../../../../../projects/shared/src/public-api';
import {
  IRequestCreateOrganization,
  IRequestUpdateOrganization,
} from '../../dto/organization.dto';
import { OrganizationsApi } from '../../services/organizations-api';
import { Users } from '../../../users/users';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageStructure } from '../../../../components/page-structure/page-structure';
import { provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideTrash2, lucideLoader2 } from '@ng-icons/lucide';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-handle-organization',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    RouterLink,
    LoadingContent,
    LoadingButton,
    Users,
    TranslateModule,
    PageStructure,
    HlmButtonDirective,
    HlmCardDirective,
    HlmInputDirective,
    HlmLabelDirective,
    HlmIconComponent, 
    HasPermissionDirective
  ],
  providers: [provideIcons({ lucideArrowLeft, lucideTrash2, lucideLoader2 })],
  templateUrl: './handle-organization.html',
})
export class HandleOrganization {
  form = new FormGroup({
    name: new FormControl('', Validators.required),
    description: new FormControl(''),
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
        .subscribe((organization) => {
          if (organization) {
            this.name.set(organization.name);

            this.form.patchValue({
              name: organization.name,
              description: organization.description,
            });
          }
        });
    });
  }

  async save() {
    if (this.form.invalid) return;

    const data: IRequestCreateOrganization | IRequestUpdateOrganization = this
      .form.value as IRequestCreateOrganization | IRequestUpdateOrganization;
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
