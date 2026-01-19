import { Routes } from '@angular/router';
import { permissionGuard } from '../../shared/guards/permission.guard';

export const usersRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./users').then((c) => c.Users),
    canActivate: [permissionGuard],
    data: { permission: 'user:list' },
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./pages/handle-user/handle-user').then((c) => c.HandleUser),
    canActivate: [permissionGuard],
    data: { permission: 'user:create' },
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./pages/handle-user/handle-user').then((c) => c.HandleUser),
    canActivate: [permissionGuard],
    data: { permission: 'user:update' },
  },
];
