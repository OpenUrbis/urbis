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
import { passwordFormGroup } from '../../../../../../projects/shared/src/lib/components/password-form-group/form-group/password-form-group';
import { PasswordFormGroup } from '../../../../../../projects/shared/src/lib/components/password-form-group/password-form-group';
import {
  LoadingButton,
  LoadingContent,
  useConfirmDialog,
  HlmButtonDirective,
  HlmInputDirective,
  HlmLabelDirective,
  HlmIconComponent,
  HlmToasterService
} from '../../../../../../projects/shared/src/public-api';
import { UserRoleManager } from '../../../../components/role-manager/user-role-manager/user-role-manager';
import { UserOrganizationManager } from '../../../../components/user-organization-manager/user-organization-manager';
import { ICreateUserRequest, IUpdateUserRequest } from '../../dto/user.dto';
import { UsersApi } from '../../services/users-api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageStructure } from '../../../../components/page-structure/page-structure';
import { provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideTrash2 } from '@ng-icons/lucide';

@Component({
  selector: 'app-handle-user',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PasswordFormGroup,
    CommonModule,
    RouterLink,
    LoadingContent,
    LoadingButton,
    UserOrganizationManager,
    UserRoleManager,
    TranslateModule,
    PageStructure,
    HlmButtonDirective,
    HlmInputDirective,
    HlmLabelDirective,
    HlmIconComponent
  ],
  providers: [provideIcons({ lucideArrowLeft, lucideTrash2 })],
  templateUrl: './handle-user.html',
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
  selectedTab = signal<number>(0);

  toaster = inject(HlmToasterService);
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  userApi = inject(UsersApi);
  confirmDialog = useConfirmDialog();
  translate = inject(TranslateService);

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
                  this.toaster.error('Houve um erro ao carregar o usuário');
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

      this.toaster.success(
        `Usuário ${id ? 'atualizado' : 'criado'} com sucesso`,
      );
    } catch (error) {
      console.error(error);
      this.toaster.error(
        `Houve um erro ao ${id ? 'atualizar' : 'criar'} o usuário`,
      );
    } finally {
      this.loadingSave.set(false);
    }
  }

  async deleteUser(id: string) {
    try {
      await this.confirmDialog(
        {
          title: 'Deseja excluir este usuário?',
          description: 'Esta ação é irreversivel.',
        },
        { resultMode: 'reject' },
      );

      this.loading.set(true);

      await firstValueFrom(this.userApi.delete(id));

      this.router.navigate(['/users'], { replaceUrl: true });
    } catch (err: any) {
      console.error(err);
      if (err?.internalMessage) return;

      this.toaster.error('Não foi possivel excluir este usuário');
    } finally {
      this.loading.set(false);
    }
  }
}
