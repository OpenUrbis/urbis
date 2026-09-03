import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { lucidePlus } from '@ng-icons/lucide';
import {
  HlmButtonDirective,
  HlmIconComponent,
} from '../../../../projects/shared/src/public-api';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { HelpQuestionList } from './help-question-list';
import { HelpTabsList } from './help-tabs-list';

@Component({
  selector: 'app-help-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HasPermissionDirective,
    HelpTabsList,
    HelpQuestionList,
    HlmIconComponent,
    HlmButtonDirective,
  ],
  providers: [provideIcons({ lucidePlus })],
  template: `
    <section class="p-6 space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold">Ajuda</h1>
          <p class="text-sm text-muted-foreground">
            Gerencie abas e perguntas da central de ajuda.
          </p>
        </div>

        <div class="flex gap-2">
          <a
            hlmBtn
            *hasPermission="'question-tab:create'"
            routerLink="/help/tabs/new"
          >
            <hlm-icon name="lucidePlus" size="16" class="mr-2" />
            Nova aba </a
          ><a
            hlmBtn
            *hasPermission="'question-answer:create'"
            routerLink="/help/questions/new"
          >
            <hlm-icon name="lucidePlus" size="16" class="mr-2" />
            Nova pergunta
          </a>
        </div>
      </div>

      <div class="flex border-b">
        <button
          *hasPermission="'question-tab:list'"
          (click)="selectedTab.set('tabs')"
          class="px-4 py-2 text-sm font-medium border-b-2"
          [class.border-primary]="selectedTab() === 'tabs'"
          [class.text-foreground]="selectedTab() === 'tabs'"
          [class.border-transparent]="selectedTab() !== 'tabs'"
          [class.text-muted-foreground]="selectedTab() !== 'tabs'"
        >
          Abas
        </button>
        <button
          *hasPermission="'question-answer:list'"
          (click)="selectedTab.set('questions')"
          class="px-4 py-2 text-sm font-medium border-b-2"
          [class.border-primary]="selectedTab() === 'questions'"
          [class.text-foreground]="selectedTab() === 'questions'"
          [class.border-transparent]="selectedTab() !== 'questions'"
          [class.text-muted-foreground]="selectedTab() !== 'questions'"
        >
          Perguntas
        </button>
      </div>

      <div class="mt-6">
        @if (selectedTab() === 'tabs') {
          <app-help-tabs-list />
        } @else if (selectedTab() === 'questions') {
          <app-help-question-list />
        }
      </div>
    </section>
  `,
})
export class HelpList {
  readonly selectedTab = signal<'tabs' | 'questions'>('tabs');
}
