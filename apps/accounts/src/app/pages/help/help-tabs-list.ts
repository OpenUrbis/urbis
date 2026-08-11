import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { lucidePencil, lucidePlus } from '@ng-icons/lucide';
import {
  HlmButtonDirective,
  HlmIconComponent,
} from '../../../../projects/shared/src/public-api';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { QuestionTab } from './help.models';
import { HelpService } from './help.service';

@Component({
  selector: 'app-help-tabs-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HasPermissionDirective,
    HlmButtonDirective,
    HlmIconComponent,
  ],
  providers: [provideIcons({ lucidePlus, lucidePencil })],
  template: `
    <section class="space-y-6">
      @if (loading()) {
        <div class="text-sm text-muted-foreground">Carregando...</div>
      } @else if (error()) {
        <div class="text-sm text-destructive">{{ error() }}</div>
      } @else if (!tabs().length) {
        <div
          class="flex flex-col items-center justify-center p-8 border rounded-lg border-dashed"
        >
          <div class="text-sm text-muted-foreground mb-4">
            Nenhuma aba cadastrada.
          </div>

          <a
            *hasPermission="'question-tab:create'"
            routerLink="/help/tabs/new"
            class="inline-flex items-center rounded-md px-4 py-2 text-sm bg-primary text-primary-foreground font-medium"
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
                  [routerLink]="['/help/tabs', tab.id, 'edit']"
                  class="block flex-1 hover:opacity-90"
                >
                  <div class="font-medium">
                    {{ tab.index }} - {{ tab.name }}
                  </div>
                  <div class="text-sm text-muted-foreground">
                    {{ tab.description }}
                  </div>
                </a>

                <div class="flex gap-2">
                  <a
                    *hasPermission="'question-answer:create'"
                    [routerLink]="['/help/questions/new']"
                    [queryParams]="{ tabId: tab.id }"
                    hlmBtn
                    size="icon"
                    variant="outline"
                  >
                    <hlm-icon name="lucidePlus" size="14" />
                  </a>

                  <a
                    *hasPermission="'question-tab:update'"
                    [routerLink]="['/help/tabs', tab.id, 'edit']"
                    hlmBtn
                    size="icon"
                    variant="outline"
                  >
                    <hlm-icon name="lucidePencil" size="14" />
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
  private readonly location = inject(Location);
  private readonly router = inject(Router);

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
