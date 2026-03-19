import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import {
  lucideBriefcase,
  lucideBuilding2,
  lucideCheck,
  lucideChevronsUpDown,
  lucideFileText,
  lucideHelpCircle,
  lucideLogOut,
  lucidePalette,
  lucidePlus,
  lucideSettings,
  lucideShieldCheck,
  lucideShuffle,
  lucideUser,
  lucideUsers,
} from '@ng-icons/lucide';
import { TranslateModule } from '@ngx-translate/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { firstValueFrom } from 'rxjs';
import { AUTH_CONFIG_ID } from '../../../../../../projects/shared/src/lib/auth/auth.config';
import {
  HlmButtonDirective,
  HlmDialogService,
  HlmDropdownMenuDirective,
  HlmDropdownMenuGroupDirective,
  HlmDropdownMenuItemDirective,
  HlmDropdownMenuLabelDirective,
  HlmDropdownMenuSeparatorDirective,
  HlmDropdownMenuTriggerDirective,
  HlmIconComponent,
  HlmSidebarGroupDirective,
  HlmSidebarMenuButtonDirective,
  HlmSidebarMenuDirective,
  HlmSidebarService,
} from '../../../../../../projects/shared/src/public-api';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { OrganizationState } from '../../../../states/organization/organization.state';
import { SwitchOrganizationDialog } from '../../../switch-organization-dialog/switch-organization-dialog';

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
    HasPermissionDirective,
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
      lucidePlus,
      lucideHelpCircle,
      lucideBriefcase,
      lucideFileText,
    }),
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
