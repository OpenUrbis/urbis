import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { QuestionTab } from './help.models';
import { HelpService } from './help.service';

@Component({
  selector: 'app-help-tabs-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="p-6 space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold">Abas de ajuda</h1>
          <p class="text-sm text-muted-foreground">
            Escolha uma aba para visualizar, editar e organizar suas perguntas.
          </p>
        </div>

        <a
          routerLink="/help/tabs/new"
          class="inline-flex items-center rounded-md border px-4 py-2 text-sm"
        >
          Nova aba
        </a>
      </div>

      @if (loading()) {
        <div class="text-sm text-muted-foreground">Carregando...</div>
      } @else if (error()) {
        <div class="text-sm text-destructive">{{ error() }}</div>
      } @else if (!tabs().length) {
        <div class="space-y-3">
          <div class="text-sm text-muted-foreground">
            Nenhuma aba cadastrada.
          </div>

          <a
            routerLink="/help/tabs/new"
            class="inline-flex items-center rounded-md border px-4 py-2 text-sm"
          >
            Criar primeira aba
          </a>
        </div>
      } @else {
        <div class="space-y-3">
          @for (tab of tabs(); track tab.id) {
            <div class="rounded-md border p-4 space-y-3">
              <div class="flex items-start justify-between gap-4">
                <a
                  [routerLink]="['/help/tabs', tab.id]"
                  class="block flex-1 hover:opacity-90"
                >
                  <div class="font-medium">{{ tab.index }} - {{ tab.name }}</div>
                  <div class="text-sm text-muted-foreground">
                    {{ tab.description }}
                  </div>
                </a>

                <div class="flex gap-2">
                  <a
                    [routerLink]="['/help/tabs', tab.id, 'edit']"
                    class="rounded-md border px-3 py-2 text-sm"
                  >
                    Editar aba
                  </a>

                  <a
                    [routerLink]="['/help/tabs', tab.id, 'order']"
                    class="rounded-md border px-3 py-2 text-sm"
                  >
                    Ordenar perguntas
                  </a>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class HelpTabsList implements OnInit {
  private readonly helpService = inject(HelpService);

  readonly tabs = signal<QuestionTab[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loading.set(true);
    this.error.set(null);

    this.helpService.listTabs().subscribe({
      next: (tabs: QuestionTab[]) => {
        this.tabs.set([...tabs].sort((a, b) => a.index - b.index));
        this.loading.set(false);
      },
      error: (err: any) => {
        this.error.set(
          err?.error?.message || 'Não foi possível carregar as abas.',
        );
        this.loading.set(false);
      },
    });
  }
}