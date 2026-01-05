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
import { passwordFormGroup } from '../../../../../../projects/shared/src/lib/components/password-form-group/form-group/password-form-group';
import { PasswordFormGroup } from '../../../../../../projects/shared/src/lib/components/password-form-group/password-form-group';
import {
  LoadingButton,
  LoadingContent,
} from '../../../../../../projects/shared/src/public-api';
import { RoleManagerModule } from '../../../../components/role-manager/role-manager-module';
import { UserOrganizationManager } from '../../../../components/user-organization-manager/user-organization-manager';
import { ICreateUserRequest, IUpdateUserRequest } from '../../dto/user.dto';
import { UsersApi } from '../../services/users-api';

@Component({
  selector: 'app-handle-user',
  imports: [
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    PasswordFormGroup,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    CommonModule,
    RoleManagerModule,
    RouterLink,
    LoadingContent,
    LoadingButton,
    UserOrganizationManager,
  ],
  templateUrl: './handle-user.html',
  styleUrl: './handle-user.scss',
})
export class HandleUser {
  form = new FormGroup({
    firstName: new FormControl('', [Validators.required]),
    lastName: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: passwordFormGroup(),
  });

  id = signal<string | undefined>(undefined);
  name = signal<string | undefined>(undefined);
  loading = signal<boolean>(false);
  loadingSave = signal<boolean>(false);

  matSnackBar = inject(MatSnackBar);
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  userApi = inject(UsersApi);

  constructor() {
    effect(() => {
      this.activatedRoute.params
        .pipe(
          tap(() => this.loading.set(true)),
          switchMap(({ id }) => {
            if (id) {
              this.id.set(id);
              return this.userApi.get(id).pipe(
                catchError((err) => {
                  console.error(err);
                  this.matSnackBar.open('Houve um erro ao carregar o usuário');
                  this.router.navigate(['/users']);
                  return of(undefined);
                }),
              );
            } else return of(undefined);
          }),
          tap(() => this.loading.set(false)),
        )
        .subscribe((user) => {
          if (user) {
            this.name.set(`${user.firstName} ${user.lastName}`);

            this.form.patchValue({
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
            });

            (this.form as FormGroup<any>).removeControl('password');
          }
        });
    });
  }

  getFormControl(name: string) {
    return this.form.get(name) as FormControl;
  }

  async save() {
    if (this.form.invalid) return;

    const data: ICreateUserRequest | IUpdateUserRequest = this.form.value as
      | ICreateUserRequest
      | IUpdateUserRequest;
    const id = this.id();

    if (!id) {
      (data as ICreateUserRequest).password =
        this.form.value!.password!.password!;
    }

    try {
      this.loadingSave.set(true);
      const response = await firstValueFrom(
        id
          ? this.userApi.update(id!, data)
          : this.userApi.create(data as ICreateUserRequest),
      );

      if (!id) {
        this.router.navigate(['/users/edit', response?.id]);
      }

      this.matSnackBar.open(
        `Usuário ${id ? 'atualizado' : 'criado'} com sucesso`,
      );
    } catch (error) {
      console.error(error);
      this.matSnackBar.open(
        `Houve um erro ao ${id ? 'atualizar' : 'criar'} o usuário`,
      );
    } finally {
      this.loadingSave.set(false);
    }
  }
}
