import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { firstValueFrom } from 'rxjs';
import {
  AUTH_CONFIG_ID,
  EXTERNAL_OIDC_AUTH_CONFIG_ID,
} from '../../../../../../projects/shared/src/lib/auth/auth.config';
import { OrganizationState } from '../../../../states/organization/organization.state';
import { SwitchOrganizationDialog } from '../../../switch-organization-dialog/switch-organization-dialog';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-sidenav',
  imports: [
    MatListModule,
    MatIconModule,
    MatButtonModule,
    RouterModule,
    MatDialogModule,
    // SwitchOrganizationDialog,
    TranslateModule,
  ],
  templateUrl: './sidenav.html',
  styleUrl: './sidenav.scss',
})
export class Sidenav {
  oidcSecurityService = inject(OidcSecurityService);
  organizationState = inject(OrganizationState);
  matDialog = inject(MatDialog);

  changeOrganization() {
    this.matDialog.open(SwitchOrganizationDialog);
  }

  async logout() {
    this.organizationState.clearSelectedOrganization();
    await firstValueFrom(this.oidcSecurityService.logoff(AUTH_CONFIG_ID));
  }
}
