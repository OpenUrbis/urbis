import { Routes } from '@angular/router';
import { autoLoginPartialRoutesGuardWithConfig } from 'angular-auth-oidc-client';
import { AUTH_CONFIG_ID } from '../../projects/shared/src/lib/auth/auth.config';
import { onboardingGuard } from './shared/auth/guards/onboarding-guard';

export const routes: Routes = [
  {
    path: 'sign-in',
    loadComponent: () =>
      import('./pages/sign-in/sign-in').then((c) => c.SignIn),
  },
  {
    path: 'sign-up',
    loadComponent: () =>
      import('./pages/sign-up/sign-up').then((c) => c.SignUp),
  },
  {
    path: 'confirm-account/:hash',
    loadComponent: () =>
      import('./pages/confirm-account/confirm-account').then(
        (c) => c.ConfirmAccount,
      ),
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
      import('./../../projects/shared/src/lib/auth/unauthorized/unauthorized').then(
        (c) => c.Unauthorized,
      ),
  },
  {
    path: 'two-factor',
    loadComponent: () =>
      import('./components/two-factor/two-factor').then((c) => c.TwoFactor),
  },

  {
    path: 'forgot-password',
    loadChildren: () =>
      import('./pages/forgot-password/forgot-password.routes').then(
        (m) => m.forgotPasswordRoutes,
      ),
  },
  {
    path: '',
    canActivate: [autoLoginPartialRoutesGuardWithConfig(AUTH_CONFIG_ID)],
    children: [
      {
        path: 'onboarding',
        loadComponent: () =>
          import('./pages/onboarding/onboarding').then((c) => c.Onboarding),
      },
      {
        path: '',
        canActivate: [onboardingGuard],
        loadComponent: () =>
          import('./components/drawer/drawer').then((c) => c.Drawer),
        children: [
          {
            path: '',
            redirectTo: 'profile',
            pathMatch: 'full',
          },
          {
            path: 'profile',
            canActivate: [
              autoLoginPartialRoutesGuardWithConfig(AUTH_CONFIG_ID),
            ],
            loadChildren: () =>
              import('./pages/profile/profile.routes').then(
                (m) => m.profileRoutes,
              ),
          },
          {
            path: 'roles',
            loadComponent: () =>
              import('./pages/roles/roles').then((m) => m.Roles),
          },
          {
            path: 'users',
            loadChildren: () =>
              import('./pages/users/users.routes').then((m) => m.usersRoutes),
          },
          {
            path: 'organizations',
            loadChildren: () =>
              import('./pages/organizations/organizations.routes').then(
                (m) => m.organizationsRoutes,
              ),
          },
          {
            path: 'settings',
            loadComponent: () =>
              import('./pages/whitelabel/whitelabel').then((m) => m.Whitelabel),
          },
        ],
      },
    ],
  },
];
