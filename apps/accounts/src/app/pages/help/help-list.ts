import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-help-list',
  standalone: true,
  imports: [RouterModule],
  template: `
    <section class="p-6 space-y-4">
      <h1 class="text-2xl font-semibold">Ajuda</h1>

      <a
        routerLink="/help/new"
        class="inline-flex items-center rounded-md border px-4 py-2 text-sm"
      >
        Novo item
      </a>
    </section>
  `,
})
export class HelpList {}