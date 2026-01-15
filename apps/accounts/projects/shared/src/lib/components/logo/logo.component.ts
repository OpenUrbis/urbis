import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
    selector: 'lib-logo',
    standalone: true,
    imports: [CommonModule],
    template: `
    <img
      [src]="variant() === 'alt' ? 'logo-alt.svg' : 'logo.svg'"
      [style.width]="width()"
      alt="Urbis Logo"
      class="logo"
    />
  `,
    styles: [`
    .logo {
      display: block;
      height: auto;
    }
  `]
})
export class LogoComponent {
    width = input<string>('120px');
    variant = input<'default' | 'alt'>('default');
}
