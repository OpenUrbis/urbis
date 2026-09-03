import { Routes } from '@angular/router';

export const profileRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./profile').then((c) => c.Profile),
  },
  {
    path: 'edit',
    loadComponent: () =>
      import('./pages/profile-edit/profile-edit').then((c) => c.ProfileEdit),
  },
  {
    path: 'usage',
    loadComponent: () =>
      import('./pages/usage-limit/usage-limit').then((c) => c.UsageLimit),
  },
  {
    path: 'api-keys',
    loadComponent: () =>
      import('./pages/api-keys/api-keys').then((c) => c.ApiKeysComponent),
  },
];
