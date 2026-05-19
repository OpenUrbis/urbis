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
import { lucideArrowLeft, lucideTrash2, lucideMap, lucideChevronDown } from '@ng-icons/lucide';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { catchError, firstValueFrom, of, switchMap, tap, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { decode } from '@open-urbis/numeracao-digital';
import { HttpClient } from '@angular/common/http';
import { passwordFormGroup } from '../../../../../../projects/shared/src/lib/components/password-form-group/form-group/password-form-group';
import { PasswordFormGroup } from '../../../../../../projects/shared/src/lib/components/password-form-group/password-form-group';
import {
  HlmButtonDirective,
  HlmIconComponent,
  HlmInputDirective,
  HlmLabelDirective,
  HlmToasterService,
  HlmSwitchComponent,
  LoadingButton,
  LoadingContent,
  useConfirmDialog,
} from '../../../../../../projects/shared/src/public-api';
import { PageStructure } from '../../../../components/page-structure/page-structure';
import { UserRoleManager } from '../../../../components/role-manager/user-role-manager/user-role-manager';
import { UserOrganizationManager } from '../../../../components/user-organization-manager/user-organization-manager';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { ICreateUserRequest, IUpdateUserRequest } from '../../dto/user.dto';
import { UsersApi } from '../../services/users-api';

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
    HlmIconComponent,
    HlmSwitchComponent,
    HasPermissionDirective,
    PageStructure,
  ],
  providers: [provideIcons({ lucideArrowLeft, lucideTrash2, lucideMap, lucideChevronDown })],
  templateUrl: './handle-user.html',
})
export class HandleUser {
  id = signal<string | undefined>(undefined);
  name = signal<string | undefined>(undefined);
  loading = signal<boolean>(false);
  loadingSave = signal<boolean>(false);
  selectedTab = signal<number>(0);

  noOfficialAddress = signal<boolean>(false);
  loadingCep = signal<boolean>(false);
  digitalAddressError = signal<string | null>(null);
  private digitalAddressSubject = new Subject<string>();

  form = new FormGroup({
    firstName: new FormControl('', [Validators.required]),
    lastName: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: passwordFormGroup(),
    socialName: new FormControl(''),
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
  });

  toaster = inject(HlmToasterService);
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  userApi = inject(UsersApi);
  confirmDialog = useConfirmDialog();
  translate = inject(TranslateService);
  private http = inject(HttpClient);

  constructor() {
    this.digitalAddressSubject
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((value) => {
        this.validateDigitalAddress(value);
      });

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

            this.form.patchValue({
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              socialName: user.socialName,
              phone: user.phone,
              digitalAddress: user.digitalAddress,
            });

            (this.form as FormGroup<any>).removeControl('password');
          }
        });
    });
  }

  getFormControl(name: string) {
    return this.form.get(name) as FormControl;
  }

  onDigitalAddressInput(event: any) {
    const value = event.target.value.toUpperCase();
    this.digitalAddressSubject.next(value);
  }

  private validateDigitalAddress(value: string) {
    if (!value) {
      this.digitalAddressError.set(null);
      this.form.get('digitalAddress')?.setErrors(null);
      return;
    }

    let cleanValue = value.trim();
    const base27Regex = /^[23456789BCDFGHJKLMNPQTVWXYZ]{7}$/;
    const rawCode = cleanValue.replace(/[\s-]/g, '');
    
    if (base27Regex.test(rawCode)) {
      cleanValue = `-23-46 ${rawCode.substring(0, 3)}-${rawCode.substring(3)}`;
      this.form.get('digitalAddress')?.setValue(cleanValue, { emitEvent: false });
    }

    try {
      decode(cleanValue);
      this.digitalAddressError.set(null);
      this.form.get('digitalAddress')?.setErrors(null);
    } catch (e) {
      try {
        const parts = cleanValue.split(' ');
        if (parts.length === 2) {
           const normalized = parts[0] + " " + parts[1].replace('-', '');
           decode(normalized);
           this.digitalAddressError.set(null);
           this.form.get('digitalAddress')?.setErrors(null);
           return;
        }
        throw e;
      } catch (innerE) {
        const errorMsg = this.translate.instant('pages.signUp.errors.invalidDigitalAddress');
        this.digitalAddressError.set(errorMsg);
        this.form.get('digitalAddress')?.setErrors({ invalidDigitalAddress: true });
      }
    }
  }

  async checkCep() {
    let cep = this.form.get('address.cep')?.value?.replace(/\D/g, '') || '';
    if (cep.length > 8) cep = cep.substring(0, 8);
    
    if (cep.length > 5) {
      this.form.get('address.cep')?.setValue(`${cep.substring(0, 5)}-${cep.substring(5)}`, { emitEvent: false });
    } else {
      this.form.get('address.cep')?.setValue(cep, { emitEvent: false });
    }

    if (cep.length !== 8) return;

    this.loadingCep.set(true);
    try {
      const data: any = await firstValueFrom(
        this.http.get(`https://viacep.com.br/ws/${cep}/json/`),
      );
      if (!data.erro) {
        this.form.patchValue({
          address: {
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf,
          },
        });
      }
    } catch (error) {
      console.error('Error fetching CEP', error);
    } finally {
      this.loadingCep.set(false);
    }
  }

  async save() {
    if (this.form.invalid) return;

    const rawValue = this.form.getRawValue();
    const id = this.id();

    const data: any = {
      firstName: rawValue.firstName,
      lastName: rawValue.lastName,
      email: rawValue.email,
      socialName: rawValue.socialName,
      phone: rawValue.phone,
      address: !this.noOfficialAddress() ? JSON.stringify(rawValue.address) : null,
      digitalAddress: this.noOfficialAddress() ? rawValue.digitalAddress : null,
    };

    if (!id) {
      data.password = rawValue.password.password;
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
