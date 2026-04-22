import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { HlmIconComponent } from '../../ui/icon/hlm-icon.component';
import { provideIcons } from '@ng-icons/core';
import { lucideLoader2 } from '@ng-icons/lucide';

@Component({
  selector: 'lib-loading-content',
  imports: [CommonModule, HlmIconComponent],
  providers: [provideIcons({ lucideLoader2 })],
  template: `@if (loading()) {
      <div class="flex justify-center p-5">
        <hlm-icon name="lucideLoader2" class="animate-spin h-8 w-8 text-primary" />
      </div>
    } @else {
      <ng-content />
    }`,
})
export class LoadingContent {
  loading = input<boolean>(false);
}
