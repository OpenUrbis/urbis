import { Routes } from '@angular/router';

export const helpRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./help-list').then((c) => c.HelpList),
  },
  {
    path: 'tabs',
    loadComponent: () =>
      import('./help-tabs-list').then((c) => c.HelpTabsList),
  },
  {
    path: 'tabs/new',
    loadComponent: () =>
      import('./help-tab-form').then((c) => c.HelpTabForm),
  },
  {
    path: 'tabs/:id/edit',
    loadComponent: () =>
      import('./help-tab-form').then((c) => c.HelpTabForm),
  },
  {
    path: 'tabs/:id',
    loadComponent: () =>
      import('./help-tab-details').then((c) => c.HelpTabDetails),
  },
  {
    path: 'tabs/:id/order',
    loadComponent: () =>
      import('./help-tab-order').then((c) => c.HelpTabOrder),
  },
  {
    path: 'questions',
    loadComponent: () =>
      import('./help-question-list').then((c) => c.HelpQuestionList),
  },
  {
    path: 'questions/new',
    loadComponent: () =>
      import('./help-question-form').then((c) => c.HelpQuestionForm),
  },
  {
    path: 'questions/:id/edit',
    loadComponent: () =>
      import('./help-question-form').then((c) => c.HelpQuestionForm),
  },
];