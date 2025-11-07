import { HttpClient } from '@angular/common/http';
import { Component, effect, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { jwtDecode } from 'jwt-decode';
import { PermissionSelector } from '../../components/permission-selector/permission-selector';
import { RoleManagerModule } from '../../components/role-manager/role-manager-module';

@Component({
  selector: 'app-home',
  imports: [MatButtonModule, RoleManagerModule, PermissionSelector],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  matSnackBar = inject(MatSnackBar);
  formcontrol = new FormControl();

  constructor(
    private readonly api: HttpClient,
    private readonly oidcService: OidcSecurityService,
  ) {
    effect(() => this.formcontrol.valueChanges.subscribe(console.log));
  }

  test() {
    this.oidcService.checkAuth().subscribe(({ isAuthenticated, idToken }) => {
      if (isAuthenticated) {
        const decoded: any = jwtDecode(idToken);
      }
    });
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
