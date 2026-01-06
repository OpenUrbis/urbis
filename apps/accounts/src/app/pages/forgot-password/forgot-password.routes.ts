import { Routes } from '@angular/router';

export const forgotPasswordRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./forgot-password').then((c) => c.ForgotPassword),
  },
  {
    path: 'sent',
    loadComponent: () =>
      import('./pages/forgot-password-sent/forgot-password-sent').then(
        (c) => c.ForgotPasswordSent,
      ),
  },
  {
    path: 'reset/:hash',
    loadComponent: () =>
      import('./pages/forgot-password-reset/forgot-password-reset').then(
        (c) => c.ForgotPasswordReset,
      ),
  },
];
