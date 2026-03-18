import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { lucidePencil, lucideTrash2 } from '@ng-icons/lucide';
import {
  HlmButtonDirective,
  HlmIconComponent,
} from '../../../../projects/shared/src/public-api';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { QuestionAnswer } from './help.models';
import { HelpService } from './help.service';

@Component({
  selector: 'app-help-question-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HasPermissionDirective,
    HlmButtonDirective,
    HlmIconComponent,
  ],
  providers: [provideIcons({ lucidePencil, lucideTrash2 })],
  template: `
    <section class="space-y-6">
      @if (loading()) {
        <div class="text-sm text-muted-foreground">Carregando...</div>
      } @else if (error()) {
        <div class="text-sm text-destructive">{{ error() }}</div>
      } @else if (!questions().length) {
        <div
          class="flex flex-col items-center justify-center p-8 border rounded-lg border-dashed"
        >
          <div class="text-sm text-muted-foreground mb-4">
            Nenhuma pergunta cadastrada.
          </div>

          <a
            *hasPermission="'question-answer:create'"
            routerLink="/help/questions/new"
            class="inline-flex items-center rounded-md px-4 py-2 text-sm bg-primary text-primary-foreground font-medium"
          >
            Nova pergunta
          </a>
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
                    *hasPermission="'question-answer:update'"
                    [routerLink]="['/help/questions', item.id, 'edit']"
                    hlmBtn
                    size="icon"
                    variant="outline"
                  >
                    <hlm-icon name="lucidePencil" size="14" />
                  </a>

                  <button
                    *hasPermission="'question-answer:delete'"
                    type="button"
                    (click)="remove(item)"
                    [disabled]="deletingId() === item.id"
                    hlmBtn
                    size="icon"
                    variant="destructive"
                  >
                    <hlm-icon name="lucideTrash2" size="14" />
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
