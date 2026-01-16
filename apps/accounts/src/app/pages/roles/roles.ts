import { Component } from '@angular/core';
import { RolesManager } from '../../components/role-manager/roles-manager/roles-manager';

@Component({
  selector: 'app-roles',
  imports: [RolesManager],
  templateUrl: './roles.html',
})
export class Roles {}
