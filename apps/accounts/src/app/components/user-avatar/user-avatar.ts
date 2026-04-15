import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageFallbackDirective } from '../../shared/guards/fallback-image.guard';
import { HlmAvatarDirective, HlmAvatarFallbackDirective } from '../../../../projects/shared/src/lib/ui/avatar/hlm-avatar.directive';

@Component({
  selector: 'app-user-avatar',
  imports: [
    CommonModule,
    ImageFallbackDirective,
    HlmAvatarDirective,
    HlmAvatarFallbackDirective
  ],
  template: `
    <hlm-avatar [style.width.px]="width()" [style.height.px]="height()">
      <img
        [src]="src()"
        fallbackSrc="https://api.dicebear.com/9.x/initials/svg?seed={{
          firstName()
        }}-{{ lastName() }}&radius=50"
        class="h-full w-full object-cover"
        alt="User Avatar"
      />
      <span hlmAvatarFallback class="text-lg bg-primary text-primary-foreground">
        {{ firstName()[0] }}{{ lastName()[0] }}
      </span>
    </hlm-avatar>
  `,
})
export class UserAvatarComponent {
  src = input.required<string | undefined>();
  firstName = input.required<string>();
  lastName = input.required<string>();
  width = input(120);
  height = input(120);
}
