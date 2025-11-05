import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { LoadingButton } from '../../../../../../projects/shared/src/public-api';
import {
  IResponseOrganization,
  IResponseOrganizationWithRole,
} from '../../../../pages/organizations/dto/organization.dto';
import { OrganizationSelector } from '../../../organization-selector/organization-selector';
import { IRoleResponse } from '../../../role-manager/dto/role.dto';
import { RoleManagerApi } from '../../../role-manager/services/role-manager-api';
import { RoleSelector } from '../../../role-selector/role-selector';

@Component({
  selector: 'app-handle-user-organization',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    ReactiveFormsModule,
    RoleSelector,
    OrganizationSelector,
    LoadingButton,
  ],
  templateUrl: './handle-user-organization.html',
  styleUrl: './handle-user-organization.scss',
})
export class HandleUserOrganization implements AfterViewInit {
  form = new FormGroup({
    organization: new FormControl('', Validators.required),
    roles: new FormControl('', Validators.required),
  });
  loading = signal<boolean>(false);
  organizationId = signal<string | undefined>(undefined);

  matSnackBar = inject(MatSnackBar);
  roleManagerApi = inject(RoleManagerApi);
  readonly dialogRef = inject(MatDialogRef<HandleUserOrganization>);
  readonly data = inject<{
    userId: string;
    organization: IResponseOrganizationWithRole | undefined;
  }>(MAT_DIALOG_DATA);

  get orgControl() {
    return this.form.get('organization') as FormControl;
  }

  get rolesControl() {
    return this.form.get('roles') as FormControl;
  }

  ngAfterViewInit(): void {
    console.log('PUTA', this.data);
    const organization = this.data.organization;
    if (organization) {
      this.organizationId.set(organization.id);
      const roles =
        organization?.userRoleAssignments?.map(({ role }) => role) ?? [];

      console.log('ROLES', roles);

      this.form.patchValue({ organization, roles } as any);
    }
  }

  async save() {
    const { roles, organization } = this.form.value;
    console.log(this.form.value);
    if (!roles?.length) {
      this.matSnackBar.open('Selecione ao menos um cargo para este usuário');
      return;
    }
    if (this.form.invalid) {
      this.matSnackBar.open('O formulário é inválido');
      return;
    }

    const organizationId =
      this.organizationId() ??
      (organization as unknown as IResponseOrganization).id;

    this.loading.set(true);
    try {
      if (organizationId) {
        await firstValueFrom(
          this.roleManagerApi.updateAssignByOrganization(organizationId, {
            roleIds: (this.rolesControl.value as IRoleResponse[]).map(
              ({ id }) => id,
            ),
            userId: this.data.userId,
          }),
        );
      } else {
        await firstValueFrom(
          this.roleManagerApi.createAssignByOrganization(organizationId, {
            roleIds: (this.rolesControl.value as IRoleResponse[]).map(
              ({ id }) => id,
            ),
            userId: this.data.userId,
          }),
        );
      }

      this.dialogRef.close();
    } catch (err) {
      console.error(err);
      this.matSnackBar.open(
        `Houve um erro ao realizar a ${organizationId ? 'atualização' : 'criação'} da atribuição`,
      );
    } finally {
      this.loading.set(false);
    }
  }
}
