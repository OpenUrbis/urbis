import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  HlmAvatarDirective,
  HlmAvatarFallbackDirective,
} from '../../../../projects/shared/src/lib/ui/avatar/hlm-avatar.directive';

@Component({
  selector: 'app-user-avatar',
  imports: [
    CommonModule,
    HlmAvatarDirective,
    HlmAvatarFallbackDirective,
  ],
  template: `
    <hlm-avatar [style.width.px]="width()" [style.height.px]="height()">
      @if (src() && !hasError()) {
        <img
          [src]="src()"
          (error)="hasError.set(true)"
          class="h-full w-full object-cover rounded-full"
          alt="User Avatar"
        />
      } @else {
        <span
          hlmAvatarFallback
          class="flex h-full w-full items-center justify-center rounded-full bg-muted font-bold text-muted-foreground uppercase text-xs select-none"
        >
          {{ getInitials() }}
        </span>
      }
    </hlm-avatar>
  `,
})
export class UserAvatarComponent {
  src = input<string | undefined>();
  firstName = input<string>('');
  lastName = input<string>('');
  width = input(40);
  height = input(40);

  hasError = signal(false);

  getInitials(): string {
    const fn = (this.firstName() || '').trim();
    const ln = (this.lastName() || '').trim();

    if (fn && ln) {
      return (fn[0] + ln[0]).toUpperCase();
    }

    const full = (fn || ln).trim();
    if (!full) return 'U';

    if (full.includes('@')) {
      const username = full.split('@')[0].replace(/[._-]/g, ' ').trim();
      const parts = username.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return username.slice(0, 2).toUpperCase() || 'U';
    }

    const words = full.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }

    if (words.length === 1 && words[0].length >= 2) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return full[0]?.toUpperCase() || 'U';
  }
}
