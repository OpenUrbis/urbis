import { Component } from '@angular/core';
import { RoleManagerModule } from '../../components/role-manager/role-manager-module';

@Component({
  selector: 'app-roles',
  imports: [RoleManagerModule],
  templateUrl: './roles.html',
  styleUrl: './roles.scss',
})
export class Roles {}
