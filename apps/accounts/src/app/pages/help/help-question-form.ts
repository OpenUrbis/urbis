import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CreateQuestionAnswerDto, QuestionTab } from './help.models';
import { HelpService } from './help.service';

@Component({
  selector: 'app-help-question-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <section class="p-6 space-y-6">
      <div>
        <h1 class="text-2xl font-semibold">
          {{ isEdit() ? 'Editar pergunta' : 'Nova pergunta' }}
        </h1>
        <p class="text-sm text-muted-foreground">
          Cadastre a pergunta e selecione em quais abas ela deve aparecer.
        </p>
      </div>

      @if (loading()) {
        <div class="text-sm text-muted-foreground">Carregando...</div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-6 max-w-3xl">
          <div class="space-y-4">
            <div class="space-y-1">
              <label class="text-sm font-medium">Pergunta</label>
              <input
                type="text"
                formControlName="question"
                class="w-full rounded-md border border-input bg-background px-3 py-2"
                placeholder="Ex.: O que é o Urbis?"
              />
            </div>

            <div class="space-y-1">
              <label class="text-sm font-medium">Resposta</label>
              <textarea
                rows="5"
                formControlName="answer"
                class="w-full rounded-md border border-input bg-background px-3 py-2"
                placeholder="Digite a resposta"
              ></textarea>
            </div>
          </div>

          <div class="space-y-3">
            <h2 class="text-sm font-medium">Abas vinculadas</h2>

            @if (!tabs().length) {
              <p class="text-sm text-muted-foreground">Nenhuma aba encontrada.</p>
            } @else {
              <div formArrayName="tabSelections" class="space-y-2">
                @for (tab of tabs(); track tab.id; let i = $index) {
                  <label class="flex items-center gap-2 rounded-md border p-3">
                    <input type="checkbox" [formControlName]="i" />
                    <span>{{ tab.name }}</span>
                  </label>
                }
              </div>
            }
          </div>

          @if (error()) {
            <div class="text-sm text-destructive">{{ error() }}</div>
          }

          <div class="flex gap-3">
            <button
              type="submit"
              [disabled]="saving() || form.invalid"
              class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {{ saving() ? 'Salvando...' : 'Salvar' }}
            </button>

            <a
              routerLink="/help/questions"
              class="rounded-md border border-border px-4 py-2 text-sm font-medium"
            >
              Cancelar
            </a>
          </div>
        </form>
      }
    </section>
  `,
})
export class HelpQuestionForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly helpService = inject(HelpService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly tabs = signal<QuestionTab[]>([]);
  readonly questionId = signal<string | null>(null);
  readonly isEdit = computed(() => !!this.questionId());

  readonly form = this.fb.group({
    question: ['', [Validators.required]],
    answer: ['', [Validators.required]],
    tabSelections: this.fb.array<boolean>([]),
  });

  get tabSelections(): FormArray {
    return this.form.get('tabSelections') as FormArray;
  }

  ngOnInit(): void {
    this.loading.set(true);

    this.helpService.listTabs().subscribe({
      next: (tabs) => {
        const sortedTabs = [...tabs].sort((a, b) => a.index - b.index);
        this.tabs.set(sortedTabs);

        this.tabSelections.clear();
        for (const _tab of sortedTabs) {
          this.tabSelections.push(this.fb.control(false));
        }

        const id = this.route.snapshot.paramMap.get('id');

        if (!id) {
          this.loading.set(false);
          return;
        }

        this.questionId.set(id);

        this.helpService.getQuestionById(id).subscribe({
          next: (question) => {
            this.form.patchValue({
              question: question.question,
              answer: question.answer,
            });

            const selectedTabIds = new Set(
              question.tabIds ?? question.tabs?.map((tab) => tab.id) ?? [],
            );

            this.tabs().forEach((tab, index) => {
              this.tabSelections.at(index).setValue(selectedTabIds.has(tab.id));
            });

            this.loading.set(false);
          },
          error: (err) => {
            this.error.set(err?.error?.message || 'Não foi possível carregar.');
            this.loading.set(false);
          },
        });
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Não foi possível carregar abas.');
        this.loading.set(false);
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const raw = this.form.getRawValue();

    const selectedTabIds = this.tabs()
      .filter((_tab, index) => !!raw.tabSelections?.[index])
      .map((tab) => tab.id);

    const payload: CreateQuestionAnswerDto = {
      question: String(raw.question ?? '').trim(),
      answer: String(raw.answer ?? '').trim(),
      tabIds: selectedTabIds,
    };

    const request$ = this.questionId()
      ? this.helpService.updateQuestion(this.questionId()!, payload)
      : this.helpService.createQuestion(payload);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/help/questions']);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Não foi possível salvar.');
        this.saving.set(false);
      },
    });
  }
}