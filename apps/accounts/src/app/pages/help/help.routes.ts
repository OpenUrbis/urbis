import { Routes } from '@angular/router';

export const helpRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./help-list').then((c) => c.HelpList),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./help-form').then((c) => c.HelpForm),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./help-form').then((c) => c.HelpForm),
  },
];