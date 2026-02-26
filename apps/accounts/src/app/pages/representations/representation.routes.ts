import { Routes } from '@angular/router';

export const representationRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./representations').then((c) => c.Representations),
  },
  {
    path: 'request',
    loadComponent: () =>
      import('./pages/request-representation/request-representation').then(
        (c) => c.RequestRepresentation,
      ),
  },
  {
    path: 'detail/:id',
    loadComponent: () =>
      import('./pages/solicitation-detail/solicitation-detail').then(
        (c) => c.SolicitationDetail,
      ),
  },
];
