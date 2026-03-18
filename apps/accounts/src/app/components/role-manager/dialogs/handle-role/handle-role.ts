import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDivider, MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { debounceTime, startWith, switchMap } from 'rxjs';
import { LoadingButton } from '../../../../../../projects/shared/src/public-api';
import { IPermissionResponse } from '../../dto/permission.dto';
import { IInternalPermission, IRoleResponse } from '../../dto/role.dto';
import { RoleManagerApi } from '../../services/role-manager-api';

@Component({
  selector: 'app-handle-role',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatDialogModule,
    MatListModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDivider,
    MatCardModule,
    LoadingButton,
    TranslateModule,
  ],
  templateUrl: './handle-role.html',
  styleUrl: './handle-role.scss',
})
export class HandleRole {
  searchPermissions = new FormControl('');
  form = new FormGroup({
    name: new FormControl('', Validators.required),
    description: new FormControl(),
    permissions: new FormControl([], Validators.required),
  });

  loading = signal<boolean>(false);
  selectedPermissions = signal<IInternalPermission[]>([]);

  selectedToString = computed(() =>
    this.selectedPermissions().map((prm) => prm.id),
  );

  matSnackBar = inject(MatSnackBar);
  roleManagerApi = inject(RoleManagerApi);
  translate = inject(TranslateService);

  readonly dialogRef = inject(MatDialogRef<HandleRole>);
  readonly data = inject<IRoleResponse | undefined>(MAT_DIALOG_DATA);

  title = this.data?.name
    ? `${this.translate.instant('pages.roles.page.buttons.edit.ariaLabel')} ${this.data.name}`
    : this.translate.instant('pages.roles.page.buttons.create.ariaLabel');

  permissions = toSignal(
    this.searchPermissions.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap((search) =>
        this.roleManagerApi.listPermissions({
          search,
          exclude: this.selectedToString(),
        }),
      ),
    ),
  );

  constructor() {
    if (!this.data) return;

    const { permissions, ...rest } = this.data;

    this.selectedPermissions.set(permissions!);
    this.form.patchValue({
      ...rest,
      permissions: this.selectedPermissions,
    } as any);

    effect(() => {
      this.updatePermissionsInForm();
    });
  }

  addPermission(event: MatAutocompleteSelectedEvent) {
    const permission = event.option.value as IInternalPermission;

    if (
      this.selectedPermissions().findIndex(
        (prm) => prm.action === permission.action,
      ) >= 0
    )
      return;

    const newPermission: IInternalPermission = { ...permission, scope: 'own' };

    this.selectedPermissions.update((lst) => [...lst, newPermission]);

    this.updatePermissionsInForm();

    this.searchPermissions.setValue('');
  }

  rmPermission(permission: IPermissionResponse) {
    this.selectedPermissions.update((selected) =>
      selected.filter((prm) => prm.action !== permission.action),
    );

    this.updatePermissionsInForm();
  }

  save() {
    if (!this.selectedPermissions().length) {
      this.matSnackBar.open(
        this.translate.instant(
          'components.roleManager.handleRole.errors.missingPermission',
        ),
      );
      return;
    }
    if (this.form.invalid) {
      this.matSnackBar.open(
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
    this.matSnackBar.open(
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
    this.matSnackBar.open(
      this.translate.instant(
        'components.roleManager.handleRole.errors.save',
      ),
    );
  }

  changeScope(index: number, change: MatSelectChange) {
    const value = change.value;

    this.selectedPermissions.update((permissions) => {
      permissions[index].scope = value;

      return permissions;
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
