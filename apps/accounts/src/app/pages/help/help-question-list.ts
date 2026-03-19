import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
    FormsModule,
    HasPermissionDirective,
    HlmButtonDirective,
    HlmIconComponent,
  ],
  providers: [provideIcons({ lucidePencil, lucideTrash2 })],
  template: `
    <section class="space-y-6">
      <div class="flex flex-col sm:flex-row gap-4 justify-between">
        <div class="flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
          <div class="w-full sm:w-1/2">
            <select
              [(ngModel)]="selectedApp"
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Todas as aplicações</option>
              <option value="mosaico">Mosaico</option>
              <option value="mapa">Mapa</option>
              <option value="viabiliza">Viabiliza</option>
              <option value="legis">Legis</option>
              <option value="docs">Docs</option>
            </select>
          </div>
          <div class="w-full sm:w-1/2">
            <select
              [(ngModel)]="selectedTab"
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Todas as abas</option>
              @for (tab of availableTabs(); track tab) {
                <option [value]="tab">{{ tab }}</option>
              }
            </select>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="text-sm text-muted-foreground">Carregando...</div>
      } @else if (error()) {
        <div class="text-sm text-destructive">{{ error() }}</div>
      } @else if (!filteredQuestions().length) {
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
          @for (item of filteredQuestions(); track item.id) {
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

                  @if (getAppNames(item)) {
                    <div class="mt-2 text-xs text-muted-foreground">
                      Aplicações: {{ getAppNames(item) }}
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

  selectedApp = signal<string>('');
  selectedTab = signal<string>('');

  readonly availableTabs = computed(() => {
    const tabsSet = new Set<string>();
    for (const q of this.questions()) {
      for (const tab of q.tabs || []) {
        tabsSet.add(tab.name);
      }
    }
    return Array.from(tabsSet).sort();
  });

  readonly filteredQuestions = computed(() => {
    let result = this.questions();

    const app = this.selectedApp();
    if (app) {
      result = result.filter(q => q.apps?.includes(app));
    }

    const tab = this.selectedTab();
    if (tab) {
      result = result.filter(q => q.tabs?.some(t => t.name === tab));
    }

    return result;
  });

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

  getAppNames(item: QuestionAnswer): string {
    const appsOptions: Record<string, string> = {
      mosaico: 'Mosaico',
      mapa: 'Mapa',
      viabiliza: 'Viabiliza',
      legis: 'Legis',
      docs: 'Docs',
    };
    return item.apps?.map((app) => appsOptions[app] || app).join(', ') ?? '';
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
