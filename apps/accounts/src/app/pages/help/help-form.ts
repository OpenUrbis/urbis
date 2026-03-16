import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CreateHelpItemDto, HelpContentType } from './help.models';
import { HelpService } from './help.service';

@Component({
  selector: 'app-help-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <section class="p-6 space-y-6">
      <div>
        <h1 class="text-2xl font-semibold">
          {{ isEdit() ? 'Editar item de ajuda' : 'Novo item de ajuda' }}
        </h1>
        <p class="text-sm text-muted-foreground">
          Configure o conteúdo que será exibido no Ajuda das outras abas.
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
              <label class="text-sm font-medium">Título</label>
              <input
                type="text"
                formControlName="title"
                class="w-full rounded-md border border-input bg-background px-3 py-2"
                placeholder="Ex.: Como usar o mapa?"
              />
            </div>

            <div class="space-y-1 md:col-span-2">
              <label class="text-sm font-medium">Descrição / Resposta</label>
              <textarea
                formControlName="description"
                rows="5"
                class="w-full rounded-md border border-input bg-background px-3 py-2"
                placeholder="Texto que será exibido no Ajuda"
              ></textarea>
            </div>

            <div class="space-y-1">
              <label class="text-sm font-medium">Tipo</label>
              <select
                formControlName="type"
                class="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="faq">FAQ</option>
                <option value="question">Dúvida</option>
                <option value="suggestion">Sugestão</option>
                <option value="error">Erro</option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="text-sm font-medium">Ordem</label>
              <input
                type="number"
                formControlName="order"
                class="w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </div>

            <div class="space-y-1">
              <label class="text-sm font-medium">Aplicação</label>
              <input
                type="text"
                formControlName="targetApp"
                class="w-full rounded-md border border-input bg-background px-3 py-2"
                placeholder="Ex.: map, docs, site, accounts"
              />
            </div>

            <div class="space-y-1">
              <label class="text-sm font-medium">Seção / Aba</label>
              <input
                type="text"
                formControlName="targetSection"
                class="w-full rounded-md border border-input bg-background px-3 py-2"
                placeholder="Ex.: search, layers, profile"
              />
            </div>

            <div class="space-y-1 md:col-span-2">
              <label class="text-sm font-medium">Placeholder</label>
              <input
                type="text"
                formControlName="placeholder"
                class="w-full rounded-md border border-input bg-background px-3 py-2"
                placeholder="Usado para dúvida, sugestão ou erro"
              />
            </div>

            <div class="flex items-center gap-2 md:col-span-2">
              <input id="active" type="checkbox" formControlName="active" />
              <label for="active" class="text-sm">Ativo</label>
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
              routerLink="/help"
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
export class HelpForm implements OnInit {
  private readonly fb: FormBuilder = inject(FormBuilder);
  private readonly helpService: HelpService = inject(HelpService);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly router: Router = inject(Router);

  readonly loading = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly itemId = signal<string | null>(null);
  readonly isEdit = computed(() => !!this.itemId());

  readonly form = this.fb.group({
    title: ['', [Validators.required]],
    description: ['', [Validators.required]],
    placeholder: [''],
    type: ['faq' as HelpContentType, [Validators.required]],
    targetApp: ['', [Validators.required]],
    targetSection: ['', [Validators.required]],
    order: [0, [Validators.required]],
    active: [true],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      return;
    }

    this.itemId.set(id);
    this.loading.set(true);

    this.helpService.getById(id).subscribe({
      next: (item) => {
        this.form.patchValue({
          title: item.title,
          description: item.description,
          placeholder: item.placeholder ?? '',
          type: item.type,
          targetApp: item.targetApp,
          targetSection: item.targetSection,
          order: item.order,
          active: item.active,
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(
          err?.error?.message || 'Não foi possível carregar o item.',
        );
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

    const payload: CreateHelpItemDto = {
      title: String(raw.title ?? '').trim(),
      description: String(raw.description ?? '').trim(),
      placeholder: String(raw.placeholder ?? '').trim() || null,
      type: raw.type as HelpContentType,
      targetApp: String(raw.targetApp ?? '').trim(),
      targetSection: String(raw.targetSection ?? '').trim(),
      order: Number(raw.order ?? 0),
      active: !!raw.active,
    };

    const request$ = this.itemId()
      ? this.helpService.update(this.itemId()!, payload)
      : this.helpService.create(payload);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/help']);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Não foi possível salvar.');
        this.saving.set(false);
      },
    });
  }
}