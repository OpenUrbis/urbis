import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-help-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="p-6 space-y-6">
      <div>
        <h1 class="text-2xl font-semibold">Ajuda</h1>
        <p class="text-sm text-muted-foreground">
          Gerencie abas e perguntas da central de ajuda.
        </p>
      </div>

      <div class="flex gap-3">
        <a
          routerLink="/help/tabs"
          class="rounded-md border px-4 py-2 text-sm"
        >
          Gerenciar abas
        </a>

        <a
          routerLink="/help/questions"
          class="rounded-md border px-4 py-2 text-sm"
        >
          Gerenciar perguntas
        </a>
      </div>
    </section>
  `,
})
export class HelpList {}