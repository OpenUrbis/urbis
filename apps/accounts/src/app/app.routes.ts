import { Routes } from '@angular/router';
import { AutoLoginPartialRoutesGuard } from 'angular-auth-oidc-client';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((c) => c.Home),
    canActivate: [AutoLoginPartialRoutesGuard],
  },
  {
    path: 'sign-in',
    loadComponent: () =>
      import('./pages/sign-in/sign-in').then((c) => c.SignIn),
  },
  {
    path: 'callback',
    loadComponent: () =>
      import('./../../projects/shared/src/lib/auth/callback/callback').then(
        (c) => c.Callback,
      ),
  },
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./../../projects/shared/src/lib/auth/forbidden/forbidden').then(
        (c) => c.Forbidden,
      ),
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import(
        './../../projects/shared/src/lib/auth/unauthorized/unauthorized'
      ).then((c) => c.Unauthorized),
  },
  {
    path: 'roles',
    canActivate: [AutoLoginPartialRoutesGuard],
    loadComponent: () => import('./pages/roles/roles').then((m) => m.Roles),
  },
  {
    path: 'users',
    canActivate: [AutoLoginPartialRoutesGuard],
    loadChildren: () =>
      import('./pages/users/users.routes').then((m) => m.usersRoutes),
  },
  {
    path: 'organizations',
    canActivate: [AutoLoginPartialRoutesGuard],
    loadChildren: () =>
      import('./pages/organizations/organizations.routes').then(
        (m) => m.organizationsRoutes,
      ),
  },
];
