import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ImageFallbackDirective } from '../../shared/guards/fallback-image.guard';

@Component({
  selector: 'app-user-avatar',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    ImageFallbackDirective,
  ],
  template: `
    <div class="avatar-wrapper">
      <img
        [src]="src()"
        fallbackSrc="https://api.dicebear.com/9.x/initials/svg?seed={{
          firstName()
        }}-{{ lastName() }}&radius=50"
        [style.width.px]="width()"
        [style.height.px]="height()"
      />
    </div>
  `,
  styleUrl: './user-avatar.scss',
})
export class UserAvatarComponent {
  src = input.required<string | undefined>();
  firstName = input.required<string>();
  lastName = input.required<string>();
  width = input(120);
  height = input(120);
}
