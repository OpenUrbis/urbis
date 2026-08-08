import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideTrash2 } from '@ng-icons/lucide';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RecaptchaV3Module } from 'ng-recaptcha-2';
import { catchError, firstValueFrom, of, switchMap, tap } from 'rxjs';
import { AttachmentsService } from '../../../../../../projects/shared/src/lib/components/attachments/services/attachments.service';
import { passwordFormGroup } from '../../../../../../projects/shared/src/lib/components/password-form-group/form-group/password-form-group';
import {
  HlmButtonDirective,
  HlmIconComponent,
  HlmToasterService,
  LoadingButton,
  LoadingContent,
  useConfirmDialog,
} from '../../../../../../projects/shared/src/public-api';
import { PageStructure } from '../../../../components/page-structure/page-structure';
import { UserRoleManager } from '../../../../components/role-manager/user-role-manager/user-role-manager';
import { UserFormComponent } from '../../../../components/user-form/user-form';
import { UserOrganizationManager } from '../../../../components/user-organization-manager/user-organization-manager';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { ICreateUserRequest } from '../../dto/user.dto';
import { UsersApi } from '../../services/users-api';

@Component({
  selector: 'app-handle-user',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    LoadingContent,
    LoadingButton,
    UserOrganizationManager,
    UserRoleManager,
    TranslateModule,
    PageStructure,
    HlmButtonDirective,
    HlmIconComponent,
    UserFormComponent,
    HasPermissionDirective,
    RecaptchaV3Module,
  ],
  providers: [
    provideIcons({ lucideArrowLeft, lucideTrash2 }),
    AttachmentsService,
  ],
  templateUrl: './handle-user.html',
})
export class HandleUser {
  id = signal<string | undefined>(undefined);
  name = signal<string | undefined>(undefined);
  userObj = signal<any | undefined>(undefined);
  loading = signal<boolean>(false);
  loadingSave = signal<boolean>(false);
  selectedTab = signal<number>(0);

  noOfficialAddress = signal<boolean>(false);
  documentUrls = signal<{ name: string; url: string }[]>([]);

  form = new FormGroup(
    {
      accountType: new FormControl('common', [Validators.required]),
      firstName: new FormControl('', [Validators.required]),
      lastName: new FormControl('', [Validators.required]),
      birthDate: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: passwordFormGroup(),
      socialName: new FormControl(''),
      cpf: new FormControl('', [Validators.required]),
      phoneCountry: new FormControl('+55'),
      phone: new FormControl(''),
      address: new FormGroup({
        cep: new FormControl(''),
        street: new FormControl(''),
        number: new FormControl(''),
        complement: new FormControl(''),
        neighborhood: new FormControl(''),
        city: new FormControl(''),
        state: new FormControl(''),
      }),
      digitalAddress: new FormControl(''),
    },
    {
      validators: [], // Ensure no cross-field validation on the group itself causes issues if any
    },
  );

  toaster = inject(HlmToasterService);
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  userApi = inject(UsersApi);
  confirmDialog = useConfirmDialog();
  translate = inject(TranslateService);
  private attachmentsService = inject(AttachmentsService);

  constructor() {
    effect(() => {
      this.form.valueChanges.subscribe(() => {
        console.log(this.form);
      });
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
            this.userObj.set(user);
            this.name.set(`${user.firstName} ${user.lastName}`);

            if ((user as any).metadata?.documents?.length) {
              const promises = (user as any).metadata.documents.map(
                async (key: string) => {
                  try {
                    const url =
                      await this.attachmentsService.getDownloadUrl(key);
                    return { name: key.split('/').pop() || key, url };
                  } catch (e) {
                    return { name: key.split('/').pop() || key, url: '#' };
                  }
                },
              );
              Promise.all(promises).then((docs) => this.documentUrls.set(docs));
            }

            if (user.digitalAddress) {
              this.noOfficialAddress.set(true);
            }

            if (user.address) {
              try {
                const addressData = JSON.parse(user.address);
                this.form.patchValue({ address: addressData });
              } catch (e) {
                // Fallback
              }
            }

            // Parse phone
            if (user.phone) {
              const supportedPrefixes = [
                '+55',
                '+1',
                '+351',
                '+44',
                '+34',
                '+33',
                '+49',
                '+39',
              ];
              const prefix =
                supportedPrefixes.find((p) => user.phone.startsWith(p)) ||
                '+55';
              let number = user.phone.substring(prefix.length);

              // Apply mask if +55
              if (prefix === '+55') {
                if (number.length > 10) {
                  number = `(${number.substring(0, 2)}) ${number.substring(2, 7)}-${number.substring(7)}`;
                } else if (number.length > 2) {
                  number = `(${number.substring(0, 2)}) ${number.substring(2)}`;
                }
              }

              this.form.patchValue({
                phoneCountry: prefix,
                phone: number,
              });
            }

            this.form.patchValue({
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              socialName: user.socialName,
              cpf: user.cpf,
              digitalAddress: user.digitalAddress,
              birthDate: user.birthDate,
              accountType: user.accountType,
            });

            this.getFormControl('cpf').disable();

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

    const rawValue = this.form.getRawValue();
    const id = this.id();

    // Combine phone
    let phone = rawValue.phone;
    if (rawValue.phone) {
      const cleanPhone = rawValue.phone.replace(/\D/g, '');
      phone = rawValue.phoneCountry + cleanPhone;
    }

    const data: any = {
      accountType: rawValue.accountType,
      birthDate: rawValue.birthDate,
      firstName: rawValue.firstName,
      lastName: rawValue.lastName,
      email: rawValue.email,
      socialName: rawValue.socialName,
      cpf: rawValue.cpf,
      phone: phone,
      address: !this.noOfficialAddress()
        ? JSON.stringify(rawValue.address)
        : null,
      digitalAddress: this.noOfficialAddress() ? rawValue.digitalAddress : null,
    };

    if (!id) {
      data.password = rawValue.password.password;
    } else {
      delete data.password;
      delete data.cpf;
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

  async approveAccount() {
    try {
      this.loading.set(true);
      await firstValueFrom(this.userApi.updateStatus(this.id()!, 'active'));
      this.toaster.success('Conta aprovada com sucesso!');

      const user = this.userObj();
      this.userObj.set({ ...user, status: 'active' });
    } catch (err) {
      console.error(err);
      this.toaster.error('Não foi possível aprovar a conta');
    } finally {
      this.loading.set(false);
    }
  }

  async rejectAccount() {
    try {
      await this.confirmDialog(
        {
          title: 'Deseja rejeitar e inativar esta conta?',
          description:
            'A conta ficará com status inativo e não terá acesso ao sistema.',
        },
        { resultMode: 'reject' },
      );

      this.loading.set(true);
      await firstValueFrom(this.userApi.updateStatus(this.id()!, 'inactive'));
      this.toaster.success('Conta rejeitada com sucesso!');

      const user = this.userObj();
      this.userObj.set({ ...user, status: 'inactive' });
    } catch (err: any) {
      console.error(err);
      if (err?.internalMessage) return;
      this.toaster.error('Não foi possível rejeitar a conta');
    } finally {
      this.loading.set(false);
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
