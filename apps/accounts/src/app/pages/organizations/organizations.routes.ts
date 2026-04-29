import { Routes } from '@angular/router';
import { permissionGuard } from '../../shared/guards/permission.guard';

export const organizationsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./organizations').then((c) => c.Organizations),
    /* canActivate: [permissionGuard],
    data: { permission: 'organization:list' }, */
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./pages/handle-organization/handle-organization').then(
        (c) => c.HandleOrganization,
      ),
    canActivate: [permissionGuard],
    data: { permission: 'organization:create' },
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./pages/handle-organization/handle-organization').then(
        (c) => c.HandleOrganization,
      ),
    canActivate: [permissionGuard],
    data: { permission: 'organization:update' },
  },
];
