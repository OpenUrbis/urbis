import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { firstValueFrom } from 'rxjs';
import {
  HlmIconComponent,
  HlmButtonDirective,
  HlmSidebarMenuDirective,
  HlmSidebarMenuButtonDirective,
  HlmSidebarGroupDirective,
  HlmSidebarService,
  HlmDialogService,
  HlmDropdownMenuDirective,
  HlmDropdownMenuTriggerDirective,
  HlmDropdownMenuItemDirective,
  HlmDropdownMenuLabelDirective,
  HlmDropdownMenuSeparatorDirective,
  HlmDropdownMenuGroupDirective
} from '../../../../../../projects/shared/src/public-api';
import { provideIcons } from '@ng-icons/core';
import {
  lucideUser,
  lucideShieldCheck,
  lucideUsers,
  lucideBuilding2,
  lucidePalette,
  lucideSettings,
  lucideShuffle,
  lucideLogOut,
  lucideChevronsUpDown,
  lucideCheck,
  lucidePlus
} from '@ng-icons/lucide';
import {
  AUTH_CONFIG_ID,
} from '../../../../../../projects/shared/src/lib/auth/auth.config';
import { OrganizationState } from '../../../../states/organization/organization.state';
import { SwitchOrganizationDialog } from '../../../switch-organization-dialog/switch-organization-dialog';
import { TranslateModule } from '@ngx-translate/core';
import { HasPermissionDirective } from "../../../../shared/directives/has-permission.directive";

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HlmIconComponent,
    HlmButtonDirective,
    HlmSidebarMenuDirective,
    HlmSidebarMenuButtonDirective,
    HlmSidebarGroupDirective,
    TranslateModule,
    HlmDropdownMenuDirective,
    HlmDropdownMenuTriggerDirective,
    HlmDropdownMenuItemDirective,
    HlmDropdownMenuLabelDirective,
    HlmDropdownMenuSeparatorDirective,
    HlmDropdownMenuGroupDirective,
    HasPermissionDirective
],
  providers: [
    provideIcons({
      lucideUser,
      lucideShieldCheck,
      lucideUsers,
      lucideBuilding2,
      lucidePalette,
      lucideSettings,
      lucideShuffle,
      lucideLogOut,
      lucideChevronsUpDown,
      lucideCheck,
      lucidePlus
    })
  ],
  templateUrl: './sidenav.html',
})
export class Sidenav {
  private sidebarService = inject(HlmSidebarService);
  oidcSecurityService = inject(OidcSecurityService);
  organizationState = inject(OrganizationState);
  dialog = inject(HlmDialogService);

  state = this.sidebarService.state;

  changeOrganization() {
    this.dialog.open(SwitchOrganizationDialog);
  }

  async logout() {
    this.organizationState.clearSelectedOrganization();
    await firstValueFrom(this.oidcSecurityService.logoff(AUTH_CONFIG_ID));
  }
}
