import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'lib-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <img
      [src]="variant() === 'alt' ? '/Fundo=Escuro.svg' : '/logo.png'"
      [style.width]="width()"
      alt="Prefeitura de São Paulo"
      class="logo"
    />
  `,
  styles: [
    `
      .logo {
        display: block;
        height: auto;
      }
    `,
  ],
})
export class LogoComponent {
  width = input<string>('120px');
  variant = input<'default' | 'alt'>('default');
}
