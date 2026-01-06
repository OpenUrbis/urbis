import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, firstValueFrom, of, switchMap, tap } from 'rxjs';
import {
  LoadingButton,
  LoadingContent,
} from '../../../../../../projects/shared/src/public-api';
import {
  IRequestCreateOrganization,
  IRequestUpdateOrganization,
} from '../../dto/organization.dto';
import { OrganizationsApi } from '../../services/organizations-api';
import { Users } from '../../../users/users';
import { TranslateModule } from '@ngx-translate/core';
import { PageStructure } from '../../../../components/page-structure/page-structure';

@Component({
  selector: 'app-handle-organization',
  imports: [
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    CommonModule,
    RouterLink,
    LoadingContent,
    LoadingButton,
    Users,
    TranslateModule,
    PageStructure,
  ],
  templateUrl: './handle-organization.html',
  styleUrl: './handle-organization.scss',
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

  matSnackBar = inject(MatSnackBar);
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  organizationApi = inject(OrganizationsApi);

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
                  this.matSnackBar.open(
                    'Houve um erro ao carregar a organização',
                  );
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

      this.matSnackBar.open(
        `Organização ${id ? 'atualizada' : 'criada'} com sucesso`,
      );
    } catch (error) {
      console.error(error);
      this.matSnackBar.open(
        `Houve um erro ao ${id ? 'atualizar' : 'criar'} a organização`,
      );
    } finally {
      this.loadingSave.set(false);
    }
  }
}
