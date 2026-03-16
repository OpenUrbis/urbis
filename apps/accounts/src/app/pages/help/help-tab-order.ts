import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { QuestionAnswer } from './help.models';
import { HelpService } from './help.service';

@Component({
  selector: 'app-help-tab-order',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="p-6 space-y-6">
      <div>
        <h1 class="text-2xl font-semibold">Ordenar perguntas da aba</h1>
        <p class="text-sm text-muted-foreground">
          Ajuste a ordem das perguntas exibidas nesta aba.
        </p>
      </div>

      @if (loading()) {
        <div class="text-sm text-muted-foreground">Carregando...</div>
      } @else if (error()) {
        <div class="text-sm text-destructive">{{ error() }}</div>
      } @else if (!questions().length) {
        <div class="text-sm text-muted-foreground">
          Esta aba não possui perguntas.
        </div>
      } @else {
        <div class="space-y-3">
          @for (item of questions(); track item.id; let i = $index) {
            <div class="flex items-center justify-between gap-4 rounded-md border p-3">
              <div>
                <div class="font-medium">{{ item.question }}</div>
                <div class="text-sm text-muted-foreground">{{ item.answer }}</div>
              </div>

              <div class="flex gap-2">
                <button
                  type="button"
                  (click)="moveUp(i)"
                  [disabled]="i === 0"
                  class="rounded-md border px-3 py-2 text-sm"
                >
                  ↑
                </button>
                <button
                  type="button"
                  (click)="moveDown(i)"
                  [disabled]="i === questions().length - 1"
                  class="rounded-md border px-3 py-2 text-sm"
                >
                  ↓
                </button>
              </div>
            </div>
          }
        </div>

        <div class="flex gap-3">
          <button
            type="button"
            (click)="save()"
            [disabled]="saving()"
            class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            {{ saving() ? 'Salvando...' : 'Salvar ordem' }}
          </button>

          <a
            routerLink="/help"
            class="rounded-md border px-4 py-2 text-sm font-medium"
          >
            Voltar
          </a>
        </div>
      }
    </section>
  `,
})
export class HelpTabOrder implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly helpService = inject(HelpService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly questions = signal<QuestionAnswer[]>([]);
  readonly tabId = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.error.set('Aba não encontrada.');
      return;
    }

    this.tabId.set(id);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.helpService.getTabById(this.tabId()!).subscribe({
      next: (tab) => {
        const sorted = [...(tab.answers ?? [])].sort((a, b) => a.index - b.index);
        this.questions.set(sorted);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Não foi possível carregar.');
        this.loading.set(false);
      },
    });
  }

  moveUp(index: number): void {
    if (index === 0) return;
    const list = [...this.questions()];
    [list[index - 1], list[index]] = [list[index], list[index - 1]];
    this.questions.set(list);
  }

  moveDown(index: number): void {
    const list = [...this.questions()];
    if (index >= list.length - 1) return;
    [list[index], list[index + 1]] = [list[index + 1], list[index]];
    this.questions.set(list);
  }

  save(): void {
    const tabId = this.tabId();
    if (!tabId) return;

    this.saving.set(true);
    this.error.set(null);

    this.helpService
      .reorderTabQuestions(tabId, {
        items: this.questions().map((item, index) => ({
          questionAnswerId: item.id,
          index: index + 1,
        })),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.load();
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Não foi possível salvar a ordem.');
          this.saving.set(false);
        },
      });
  }
}