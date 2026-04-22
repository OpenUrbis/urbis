import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideLoader2 } from '@ng-icons/lucide';
import { HlmButtonDirective } from '../../ui/button/hlm-button.directive';
import { HlmIconComponent } from '../../ui/icon/hlm-icon.component';

type ButtonAppearance = 'filled' | 'outlined' | 'ghost'; // Approximate mapping

@Component({
  selector: 'lib-loading-button',
  standalone: true,
  imports: [CommonModule, HlmButtonDirective, HlmIconComponent],
  providers: [provideIcons({ lucideLoader2 })],
  template: `
    <button
      hlmBtn
      [variant]="getVariant()"
      [type]="type()"
      [disabled]="loading() || disabled()"
      (click)="clickOnButton($event)"
      class="flex items-center gap-2 justify-center"
    >
      @if (loading()) {
        <hlm-icon name="lucideLoader2" class="animate-spin h-4 w-4" />
      }
      <ng-content />
    </button>
  `,
})
export class LoadingButton {
  loading = input<boolean>(false);
  type = input<'submit' | 'reset' | 'button'>('submit');
  apperance = input<ButtonAppearance | string>('filled'); // Keep name for compatibility
  disabled = input<boolean>(false);

  click = output();

  clickOnButton(event: Event) {
    // If not disabled/loading
    if (this.loading() || this.disabled()) return;
    
    // event.stopImmediatePropagation(); // Maybe not needed with native button
    this.click.emit();
  }

  getVariant(): 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive' | 'link' {
      const app = this.apperance();
      if (app === 'outlined' || app === 'stroked') return 'outline';
      if (app === 'ghost') return 'ghost';
      return 'default';
  }
}
