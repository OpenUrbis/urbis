import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { RoleManagerModule } from '../../components/role-manager/role-manager-module';
@Component({
  selector: 'app-home',
  imports: [MatButtonModule, RoleManagerModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  matSnackBar = inject(MatSnackBar);

  constructor(
    private readonly api: HttpClient,
    private readonly oidcService: OidcSecurityService,
  ) {}

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
