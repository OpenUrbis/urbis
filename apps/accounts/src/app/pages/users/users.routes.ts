import { Routes } from '@angular/router';

export const usersRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./users').then((c) => c.Users),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./pages/handle-user/handle-user').then((c) => c.HandleUser),
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./pages/handle-user/handle-user').then((c) => c.HandleUser),
  },
];
