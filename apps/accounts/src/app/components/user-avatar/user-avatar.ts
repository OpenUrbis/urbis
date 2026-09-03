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
    const f = fn ? fn[0] : '';
    const l = ln ? ln[0] : '';
    return (f + l).toUpperCase() || '?';
  }
}
