import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { QuestionTab } from './help.models';
import { HelpService } from './help.service';

@Component({
  selector: 'app-help-tab-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="p-6 space-y-6">
      @if (loading()) {
        <div class="text-sm text-muted-foreground">Carregando...</div>
      } @else if (!tab()) {
        <div class="text-sm text-destructive">Aba não encontrada.</div>
      } @else {
        <div class="space-y-2">
          <button
            type="button"
            (click)="goBack()"
            class="mb-3 rounded-md border border-border px-3 py-2 text-sm"
          >
            Voltar
          </button>

          <h1 class="text-2xl font-semibold">{{ tab()?.name }}</h1>
          <p class="text-sm text-muted-foreground">
            {{ tab()?.description }}
          </p>

          <div class="text-xs text-muted-foreground">
            Ordem da aba: {{ tab()?.index }}
          </div>
        </div>

        <div class="flex gap-3">
          <a
            [routerLink]="['/help/tabs', tab()?.id, 'order']"
            class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Ordenar perguntas desta aba
          </a>
        </div>

        <div class="space-y-3">
          <h2 class="text-lg font-semibold">Perguntas da aba</h2>

          @if (!sortedAnswers().length) {
            <div class="text-sm text-muted-foreground">
              Esta aba não possui perguntas.
            </div>
          } @else {
            @for (item of sortedAnswers(); track item.id) {
              <div class="rounded-md border p-4 space-y-2">
                <div class="font-medium">
                  {{ item.index }} - {{ item.question }}
                </div>
                <div class="text-sm text-muted-foreground">
                  {{ item.answer }}
                </div>
              </div>
            }
          }
        </div>
      }
    </section>
  `,
})
export class HelpTabDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly helpService = inject(HelpService);
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly tab = signal<QuestionTab | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.tab.set(null);
      return;
    }

    this.loading.set(true);

    this.helpService.getTabById(id).subscribe({
      next: (tab: QuestionTab) => {
        this.tab.set(tab);
        this.loading.set(false);
      },
      error: () => {
        this.tab.set(null);
        this.loading.set(false);
      },
    });
  }

  goBack(): void {
  this.router.navigate(['/help/tabs']);
}

  sortedAnswers() {
    return [...(this.tab()?.answers ?? [])].sort((a, b) => {
      const aIndex = typeof a.index === 'number' ? a.index : 999999;
      const bIndex = typeof b.index === 'number' ? b.index : 999999;
      return aIndex - bIndex;
    });
  }
}