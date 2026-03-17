import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { QuestionAnswer } from './help.models';
import { HelpService } from './help.service';

@Component({
  selector: 'app-help-question-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="p-6 space-y-6">
      <div>
        <button
          type="button"
          (click)="goBack()"
          class="mb-3 rounded-md border border-border px-3 py-2 text-sm"
        >
          Voltar
        </button>

        <div class="flex items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-semibold">Perguntas</h1>
            <p class="text-sm text-muted-foreground">
              Gerencie perguntas e em quais abas elas aparecem.
            </p>
          </div>

          <a
            routerLink="/help/questions/new"
            class="inline-flex items-center rounded-md border px-4 py-2 text-sm"
          >
            Nova pergunta
          </a>
        </div>
      </div>

      @if (loading()) {
        <div class="text-sm text-muted-foreground">Carregando...</div>
      } @else if (error()) {
        <div class="text-sm text-destructive">{{ error() }}</div>
      } @else if (!questions().length) {
        <div class="text-sm text-muted-foreground">
          Nenhuma pergunta cadastrada.
        </div>
      } @else {
        <div class="space-y-3">
          @for (item of questions(); track item.id) {
            <div class="rounded-md border p-4 space-y-2">
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0 flex-1">
                  <div class="font-medium">{{ item.question }}</div>
                  <div class="text-sm text-muted-foreground">
                    {{ item.answer }}
                  </div>

                  @if (getTabNames(item)) {
                    <div class="mt-2 text-xs text-muted-foreground">
                      Abas: {{ getTabNames(item) }}
                    </div>
                  }
                </div>

                <div class="flex gap-2 shrink-0">
                  <a
                    [routerLink]="['/help/questions', item.id, 'edit']"
                    class="rounded-md border px-3 py-2 text-sm"
                  >
                    Editar
                  </a>

                  <button
                    type="button"
                    (click)="remove(item)"
                    [disabled]="deletingId() === item.id"
                    class="rounded-md border px-3 py-2 text-sm"
                  >
                    {{ deletingId() === item.id ? 'Excluindo...' : 'Excluir' }}
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class HelpQuestionList implements OnInit {
  private readonly helpService = inject(HelpService);
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  readonly questions = signal<QuestionAnswer[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);

  ngOnInit(): void {
    this.loadQuestions();
  }

  goBack(): void {
  this.router.navigate(['/help']);
}

  loadQuestions(): void {
    this.loading.set(true);
    this.error.set(null);

    this.helpService.listQuestions().subscribe({
      next: (items: QuestionAnswer[]) => {
        this.questions.set(items);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.error.set(err?.error?.message || 'Não foi possível carregar.');
        this.loading.set(false);
      },
    });
  }

  getTabNames(item: QuestionAnswer): string {
    return item.tabs?.map((tab) => tab.name).join(', ') ?? '';
  }

  remove(item: QuestionAnswer): void {
    const confirmed = window.confirm(
      `Deseja excluir a pergunta "${item.question}"?`,
    );

    if (!confirmed) {
      return;
    }

    this.deletingId.set(item.id);
    this.error.set(null);

    this.helpService.deleteQuestion(item.id).subscribe({
      next: () => {
        this.questions.update((current) =>
          current.filter((question) => question.id !== item.id),
        );
        this.deletingId.set(null);
      },
      error: (err: any) => {
        this.error.set(err?.error?.message || 'Não foi possível excluir.');
        this.deletingId.set(null);
      },
    });
  }
}