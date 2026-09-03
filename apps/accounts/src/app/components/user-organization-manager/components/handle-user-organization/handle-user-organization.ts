import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  LoadingButton,
  LoadingContent,
  HlmButtonDirective,
  HlmLabelDirective,
  HlmToasterService,
  DialogRef,
  DIALOG_DATA,
} from '../../../../../../projects/shared/src/public-api';
import {
  IOrganization,
  IResponseOrganizationWithRole,
} from '../../../../pages/organizations/dto/organization.dto';
import { OrganizationSelector } from '../../../organization-selector/organization-selector';
import { IRoleResponse } from '../../../role-manager/dto/role.dto';
import { RoleManagerApi } from '../../../role-manager/services/role-manager-api';
import { RoleSelector } from '../../../role-selector/role-selector';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { provideIcons } from '@ng-icons/core';
import { lucidePlus, lucideX } from '@ng-icons/lucide';

@Component({
  selector: 'app-handle-user-organization',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RoleSelector,
    OrganizationSelector,
    LoadingButton,
    LoadingContent,
    TranslateModule,
    HlmButtonDirective,
    HlmLabelDirective,
  ],
  providers: [provideIcons({ lucidePlus, lucideX })],
  templateUrl: './handle-user-organization.html',
})
export class HandleUserOrganization implements AfterViewInit {
  form = new FormGroup({
    organization: new FormControl('', Validators.required),
    roles: new FormControl('', Validators.required),
  });
  loading = signal<boolean>(false);
  organizationId = signal<string | undefined>(undefined);

  toaster = inject(HlmToasterService);
  roleManagerApi = inject(RoleManagerApi);
  translate = inject(TranslateService);
  readonly dialogRef = inject(DialogRef<HandleUserOrganization>);
  readonly data = inject<{
    userId: string;
    organization: IResponseOrganizationWithRole | undefined;
  }>(DIALOG_DATA);

  get orgControl() {
    return this.form.get('organization') as FormControl;
  }

  get rolesControl() {
    return this.form.get('roles') as FormControl;
  }

  ngAfterViewInit(): void {
    const organization = this.data?.organization;
    if (organization) {
      this.organizationId.set(organization.id);
      const roles =
        organization?.userRoleAssignments?.map(({ role }) => role) ?? [];

      this.form.patchValue({ organization, roles } as any);
    }
  }

  async save() {
    const { roles, organization } = this.form.value;
    if (!roles?.length) {
      this.toaster.error(
        this.translate.instant(
          'components.userOrganizationManager.dialog.errors.selectRole',
        ),
      );
      return;
    }
    if (this.form.invalid) {
      this.toaster.error(
        this.translate.instant(
          'components.userOrganizationManager.dialog.errors.invalidForm',
        ),
      );
      return;
    }

    const organizationId =
      this.organizationId() ?? (organization as unknown as IOrganization).id;

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
      this.toaster.error(
        this.translate.instant(
          'components.userOrganizationManager.dialog.errors.save',
        ),
      );
    } finally {
      this.loading.set(false);
    }
  }
}
