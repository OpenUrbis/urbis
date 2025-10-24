import { Routes } from '@angular/router';
import { AutoLoginPartialRoutesGuard } from 'angular-auth-oidc-client';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home').then((c) => c.Home),
    canActivate: [AutoLoginPartialRoutesGuard],
  },
  {
    path: 'sign-in',
    loadComponent: () => import('./sign-in/sign-in').then((c) => c.SignIn),
  },
  {
    path: 'callback',
    loadComponent: () =>
      import('./../../projects/shared/src/lib/auth/callback/callback').then(
        (c) => c.Callback,
      ),
  },
];
