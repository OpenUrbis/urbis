import { Directive, HostBinding, Input } from '@angular/core';
import { hlm } from '../hlm/utils';

@Directive({
  selector: 'hlm-avatar, [hlmAvatar]',
  standalone: true,
})
export class HlmAvatarDirective {
  @Input() class: string = '';
  @HostBinding('class')
  get columnClass() {
    return hlm(
      'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
      this.class,
    );
  }
}

@Directive({
  selector: '[hlmAvatarFallback]',
  standalone: true,
})
export class HlmAvatarFallbackDirective {
  @Input() class: string = '';
  @HostBinding('class')
  get columnClass() {
    return hlm(
      'flex h-full w-full items-center justify-center rounded-full bg-muted',
      this.class,
    );
  }
}
