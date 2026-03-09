import { HttpClient } from '@angular/common/http';
import { Component, effect, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { OrganizationSelector } from '../../components/organization-selector/organization-selector';
import { RoleManagerModule } from '../../components/role-manager/role-manager-module';
import { RoleSelector } from '../../components/role-selector/role-selector';
import { PermissionSelector } from '../../components/permission-selector/permission-selector';
import { DemoWhitelabelComponent } from '../../components/demo-whitelabel/demo-whitelabel';
import { OrganizationState } from '../../states/organization/organization.state';
@Component({
  selector: 'app-home',
  imports: [
    MatButtonModule,
    RoleManagerModule,
    PermissionSelector,
    DemoWhitelabelComponent,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  matSnackBar = inject(MatSnackBar);
  formcontrol = new FormControl();

  constructor(
    private readonly api: HttpClient,
    private readonly oidcService: OidcSecurityService,
    private readonly organizationState: OrganizationState,
  ) {
    effect(() => this.formcontrol.valueChanges.subscribe(console.log));
  }

  test() {
    this.api.get('http://localhost:3000/role').subscribe(console.log);
  }

  selectOrganization() {
    this.api
      .get('http://localhost:3000/organization/my')
      .subscribe((orgs: any) => {
        localStorage.setItem('organization-seleted', JSON.stringify(orgs[0]));
      });
  }

  logout() {
    this.oidcService.logoff().subscribe(console.log);
  }
}
