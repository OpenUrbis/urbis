import { Routes } from '@angular/router';

export const organizationsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./organizations').then((c) => c.Organizations),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./pages/handle-organization/handle-organization').then((c) => c.HandleOrganization),
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./pages/handle-organization/handle-organization').then((c) => c.HandleOrganization),
  },
];
