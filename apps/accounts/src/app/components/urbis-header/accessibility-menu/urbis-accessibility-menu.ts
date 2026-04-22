import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  HlmButtonDirective,
  HlmIconComponent,
  HlmDropdownMenuDirective,
  HlmDropdownMenuTriggerDirective,
  HlmSwitchComponent
} from '../../../../../projects/shared/src/public-api';
import { provideIcons } from '@ng-icons/core';
import {
  lucideSettings,
  lucideSun,
  lucideMoon,
  lucideMonitor,
  lucideMinus,
  lucidePlus
} from '@ng-icons/lucide';
import { AccessibilityService } from '../../../services/accessibility.service';
import { WhitelabelState } from '../../../states/whitelabel/whitelabel.state';
import { ApplicationTheme } from '../../../states/whitelabel/whitelabel.types';

@Component({
  selector: 'app-urbis-accessibility-menu',
  standalone: true,
  imports: [
    CommonModule,
    HlmButtonDirective,
    HlmIconComponent,
    HlmDropdownMenuDirective,
    HlmDropdownMenuTriggerDirective,
    HlmSwitchComponent,
  ],
  providers: [
    provideIcons({
      lucideSettings,
      lucideSun,
      lucideMoon,
      lucideMonitor,
      lucideMinus,
      lucidePlus
    })
  ],
  template: `
    <button
      hlmBtn
      variant="outline"
      size="icon"
      [hlmDropdownMenuTrigger]="menu"
      class="h-9 w-9 rounded-md border-border bg-background hover:bg-accent hover:text-accent-foreground"
      aria-label="Acessibilidade"
    >
      <hlm-icon name="lucideSettings" size="16" />
    </button>

    <ng-template #menu>
      <div hlmDropdownMenu class="w-64 p-0">
        <div class="px-3 py-2 font-semibold border-b border-border">Acessibilidade</div>
        
        <div class="p-3 space-y-4">
          <!-- Theme -->
          <div class="space-y-2">
            <div class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tema</div>
            <div class="grid grid-cols-3 gap-1 rounded-md bg-muted p-1">
              <button
                hlmBtn
                variant="ghost"
                size="sm"
                class="h-7 w-full px-0 rounded-sm text-muted-foreground hover:text-foreground transition-all"
                [class.bg-background]="theme() === 'light'"
                [class.shadow-sm]="theme() === 'light'"
                [class.text-foreground]="theme() === 'light'"
                (click)="setTheme('light')"
                title="Modo Claro"
              >
                <hlm-icon name="lucideSun" size="14" />
              </button>
              <button
                hlmBtn
                variant="ghost"
                size="sm"
                class="h-7 w-full px-0 rounded-sm text-muted-foreground hover:text-foreground transition-all"
                [class.bg-background]="theme() === 'dark'"
                [class.shadow-sm]="theme() === 'dark'"
                [class.text-foreground]="theme() === 'dark'"
                (click)="setTheme('dark')"
                title="Modo Escuro"
              >
                <hlm-icon name="lucideMoon" size="14" />
              </button>
              <button
                hlmBtn
                variant="ghost"
                size="sm"
                class="h-7 w-full px-0 rounded-sm text-muted-foreground hover:text-foreground transition-all"
                [class.bg-background]="theme() === 'system'"
                [class.shadow-sm]="theme() === 'system'"
                [class.text-foreground]="theme() === 'system'"
                (click)="setTheme('system')"
                title="Padrão do Sistema"
              >
                <hlm-icon name="lucideMonitor" size="14" />
              </button>
            </div>
          </div>

          <div class="h-px bg-border"></div>

          <!-- Font Size -->
          <div class="space-y-2">
            <div class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tamanho da fonte</div>
            <div class="flex items-center justify-between gap-2 border border-border rounded-md p-1 bg-background">
              <button
                hlmBtn
                variant="ghost"
                size="sm"
                class="h-7 w-7 p-0 rounded-sm"
                (click)="accessibility.decreaseFont()"
                [disabled]="(accessibility.fontSize() || 100) <= 85"
              >
                <hlm-icon name="lucideMinus" size="14" />
              </button>
              <span class="text-sm font-medium tabular-nums w-12 text-center">{{ accessibility.fontSize() || 100 }}%</span>
              <button
                hlmBtn
                variant="ghost"
                size="sm"
                class="h-7 w-7 p-0 rounded-sm"
                (click)="accessibility.increaseFont()"
                [disabled]="(accessibility.fontSize() || 100) >= 125"
              >
                <hlm-icon name="lucidePlus" size="14" />
              </button>
            </div>
          </div>

          <div class="h-px bg-border"></div>

          <!-- High Contrast -->
          <div class="flex items-center justify-between">
            <div class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Alto contraste</div>
            <hlm-switch 
              [checked]="accessibility.highContrast() || false" 
              (changed)="accessibility.toggleHighContrast()" 
              class="scale-90 origin-right"
            />
          </div>
        </div>
      </div>
    </ng-template>
  `,
})
export class UrbisAccessibilityMenu {
  accessibility = inject(AccessibilityService);
  private whitelabel = inject(WhitelabelState);

  theme = computed(() => {
    const val = this.whitelabel.value();
    return (val as any)?.theme || 'light';
  });

  setTheme(theme: string) {
    this.whitelabel.setTheme(theme as ApplicationTheme);
  }
}
