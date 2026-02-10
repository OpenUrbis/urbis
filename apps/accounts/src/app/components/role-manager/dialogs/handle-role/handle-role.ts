import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { debounceTime, startWith, switchMap } from 'rxjs';
import {
  LoadingButton,
  LoadingContent,
  HlmInputDirective,
  HlmLabelDirective,
  HlmButtonDirective,
  HlmIconComponent,
  HlmToasterService,
  DialogRef,
  DIALOG_DATA,
  HlmSwitchComponent,
} from '../../../../../../projects/shared/src/public-api';
import { IPermissionResponse } from '../../dto/permission.dto';
import {
  IInternalPermission,
  IRoleResponse,
  ScopeType,
} from '../../dto/role.dto';
import { RoleManagerApi } from '../../services/role-manager-api';
import { provideIcons } from '@ng-icons/core';
import { lucidePlus, lucideX, lucideSearch } from '@ng-icons/lucide';

@Component({
  selector: 'app-handle-role',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LoadingButton,
    LoadingContent,
    TranslateModule,
    HlmInputDirective,
    HlmLabelDirective,
    HlmButtonDirective,
    HlmIconComponent,
    HlmSwitchComponent,
  ],
  providers: [provideIcons({ lucidePlus, lucideX, lucideSearch })],
  templateUrl: './handle-role.html',
})
export class HandleRole {
  searchPermissions = new FormControl('');
  form = new FormGroup({
    name: new FormControl('', Validators.required),
    description: new FormControl(),
    isDefault: new FormControl(false),
    permissions: new FormControl([], Validators.required),
  });

  loading = signal<boolean>(false);
  selectedPermissions = signal<IInternalPermission[]>([]);

  selectedToString = computed(() =>
    this.selectedPermissions().map((prm) => prm.id),
  );

  toaster = inject(HlmToasterService);
  roleManagerApi = inject(RoleManagerApi);
  translate = inject(TranslateService);

  readonly dialogRef = inject(DialogRef<HandleRole>);
  readonly data = inject<IRoleResponse | undefined>(DIALOG_DATA);

  title = this.data?.name
    ? `${this.translate.instant('pages.roles.page.buttons.edit.ariaLabel')} ${this.data.name}`
    : this.translate.instant('pages.roles.page.buttons.create.ariaLabel');

  permissions = toSignal(
    this.searchPermissions.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap((search) =>
        this.roleManagerApi.listPermissions({
          search: search || '',
          exclude: this.selectedToString(),
        }),
      ),
    ),
  );

  constructor() {
    if (this.data) {
      const { permissions, rolePermissions, ...rest } = this.data;

      let initPermissions: IInternalPermission[] = [];
      if (permissions) {
        initPermissions = permissions;
      } else if (rolePermissions) {
        initPermissions = rolePermissions.map((rp) => ({
          ...rp.permission,
          scope: rp.scope,
        }));
      }

      this.selectedPermissions.set(initPermissions);
      this.form.patchValue({
        ...rest,
      } as any);
    }

    effect(() => {
      this.updatePermissionsInForm();
    });
  }

  addPermission(permission: IPermissionResponse) {
    console.log('permission', permission);
    const hasPermission =
      this.selectedPermissions().findIndex((prm) => prm.id === permission.id) >=
      0;
    console.log('adding permission', {
      permission,
      selectedPermissions: this.selectedPermissions(),
      hasPermission,
    });
    if (hasPermission) return;

    const newPermission: IInternalPermission = { ...permission, scope: 'own' };

    this.selectedPermissions.update((lst) => [...lst, newPermission]);
    this.updatePermissionsInForm();
    this.searchPermissions.setValue('');
  }

  rmPermission(permission: IInternalPermission) {
    this.selectedPermissions.update((selected) =>
      selected.filter((prm) => prm.action !== permission.action),
    );
    this.updatePermissionsInForm();
  }

  save() {
    if (!this.selectedPermissions().length) {
      this.toaster.error(
        this.translate.instant(
          'components.roleManager.handleRole.errors.missingPermission',
        ),
      );
      return;
    }
    if (this.form.invalid) {
      this.toaster.error(
        this.translate.instant(
          'components.roleManager.handleRole.errors.invalidForm',
        ),
      );
      return;
    }
    this.loading.set(true);
    if (this.data?.id)
      this.roleManagerApi
        .update(this.data.id, this.form.value as any)
        .subscribe({
          next: (response) => this.processReponse(response as any),
          error: (err) => this.processError(err),
        });
    else
      this.roleManagerApi.create(this.form.value as any).subscribe({
        next: (response) => this.processReponse(response as any),
        error: (err) => this.processError(err),
      });
  }

  processReponse(response: IRoleResponse) {
    this.loading.set(false);
    this.toaster.success(
      this.translate.instant(
        this.data?.id
          ? 'components.roleManager.handleRole.success.updated'
          : 'components.roleManager.handleRole.success.created',
      ),
    );
    this.dialogRef.close(response);
  }

  processError(err: any) {
    this.loading.set(false);
    this.toaster.error(
      this.translate.instant('components.roleManager.handleRole.errors.save'),
    );
  }

  changeScope(index: number, event: Event) {
    const value = (event.target as HTMLSelectElement).value as ScopeType;

    this.selectedPermissions.update((permissions) => {
      permissions[index].scope = value;
      return [...permissions]; // ensure new reference
    });

    this.updatePermissionsInForm();
  }

  updatePermissionsInForm() {
    this.form.get('permissions')?.setValue(
      this.selectedPermissions()?.map(({ action, scope }) => ({
        action,
        scope,
      })) as any,
    );
  }
}
