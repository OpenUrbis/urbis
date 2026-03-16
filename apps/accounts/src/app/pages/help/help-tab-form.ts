import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CreateQuestionTabDto } from './help.models';
import { HelpService } from './help.service';

@Component({
  selector: 'app-help-tab-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <section class="p-6 space-y-6">
      <div>
        <h1 class="text-2xl font-semibold">
          {{ isEdit() ? 'Editar aba' : 'Nova aba' }}
        </h1>
        <p class="text-sm text-muted-foreground">
          Cadastre a aba que será usada para agrupar perguntas da ajuda.
        </p>
      </div>

      @if (loading()) {
        <div class="text-sm text-muted-foreground">Carregando...</div>
      } @else {
        <form
          [formGroup]="form"
          (ngSubmit)="submit()"
          class="max-w-3xl space-y-4"
        >
          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-1 md:col-span-2">
              <label class="text-sm font-medium">Nome</label>
              <input
                type="text"
                formControlName="name"
                class="w-full rounded-md border border-input bg-background px-3 py-2"
                placeholder="Ex.: Dúvidas gerais"
              />
            </div>

            <div class="space-y-1 md:col-span-2">
              <label class="text-sm font-medium">Descrição</label>
              <textarea
                formControlName="description"
                rows="4"
                class="w-full rounded-md border border-input bg-background px-3 py-2"
                placeholder="Ex.: Perguntas mais comuns sobre a plataforma"
              ></textarea>
            </div>

            <div class="space-y-1">
              <label class="text-sm font-medium">Ícone</label>
              <input
                type="text"
                formControlName="icon"
                class="w-full rounded-md border border-input bg-background px-3 py-2"
                placeholder="Ex.: info-circle"
              />
            </div>

            <div class="space-y-1">
              <label class="text-sm font-medium">Ordem</label>
              <input
                type="number"
                formControlName="index"
                class="w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </div>
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
              routerLink="/help/tabs"
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
export class HelpTabForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly helpService = inject(HelpService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly tabId = signal<string | null>(null);
  readonly isEdit = computed(() => !!this.tabId());

  readonly form = this.fb.group({
    name: ['', [Validators.required]],
    description: ['', [Validators.required]],
    icon: ['info-circle', [Validators.required]],
    index: [1, [Validators.required]],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      return;
    }

    this.tabId.set(id);
    this.loading.set(true);

    this.helpService.getTabById(id).subscribe({
      next: (tab) => {
        this.form.patchValue({
          name: tab.name,
          description: tab.description,
          icon: tab.icon,
          index: tab.index,
        });
        this.loading.set(false);
      },
      error: (err: any) => {
        this.error.set(err?.error?.message || 'Não foi possível carregar a aba.');
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

    const payload: CreateQuestionTabDto = {
      name: String(raw.name ?? '').trim(),
      description: String(raw.description ?? '').trim(),
      icon: String(raw.icon ?? '').trim(),
      index: Number(raw.index ?? 1),
    };

    const request$ = this.tabId()
      ? this.helpService.updateTab(this.tabId()!, payload)
      : this.helpService.createTab(payload);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/help/tabs']);
      },
      error: (err: any) => {
        this.error.set(err?.error?.message || 'Não foi possível salvar a aba.');
        this.saving.set(false);
      },
    });
  }
}