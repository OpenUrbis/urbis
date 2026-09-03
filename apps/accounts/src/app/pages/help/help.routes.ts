import { Routes } from '@angular/router';

export const helpRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./help-list').then((c) => c.HelpList),
  },
  {
    path: 'tabs/new',
    loadComponent: () =>
      import('./pages/handle-question-tab/handle-question-tab').then(
        (c) => c.HandleQuestionTab,
      ),
  },
  {
    path: 'tabs/:id/edit',
    loadComponent: () =>
      import('./pages/handle-question-tab/handle-question-tab').then(
        (c) => c.HandleQuestionTab,
      ),
  },
  {
    path: 'tabs/:id',
    loadComponent: () =>
      import('./pages/handle-question-tab/handle-question-tab').then(
        (c) => c.HandleQuestionTab,
      ),
  },
  {
    path: 'questions/new',
    loadComponent: () =>
      import('./pages/handle-question-answer/handle-question-answer').then(
        (c) => c.HandleQuestionAnswer,
      ),
  },
  {
    path: 'questions/:id/edit',
    loadComponent: () =>
      import('./pages/handle-question-answer/handle-question-answer').then(
        (c) => c.HandleQuestionAnswer,
      ),
  },
];
