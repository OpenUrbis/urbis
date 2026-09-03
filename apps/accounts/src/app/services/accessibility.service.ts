import { effect, Injectable, signal } from '@angular/core';

export type UrbisTheme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root',
})
export class AccessibilityService {
  fontSize = signal<number>(100);
  highContrast = signal<boolean>(false);

  constructor() {
    this.loadSettings();

    effect(() => {
      const size = this.fontSize();
      document.documentElement.style.fontSize = `${size}%`;
      localStorage.setItem('urbis-ui-font-size', size.toString());
    });

    effect(() => {
      const isHighContrast = this.highContrast();
      const html = document.documentElement;
      const body = document.body;

      if (isHighContrast) {
        html.classList.add('high-contrast');
        body.classList.add('high-contrast');
      } else {
        html.classList.remove('high-contrast');
        body.classList.remove('high-contrast');
      }
      localStorage.setItem('urbis-ui-high-contrast', isHighContrast.toString());
    });
  }

  private loadSettings() {
    const savedFontSize = localStorage.getItem('urbis-ui-font-size');
    if (savedFontSize) {
      this.fontSize.set(parseInt(savedFontSize, 10));
    }

    const savedHighContrast = localStorage.getItem('urbis-ui-high-contrast');
    if (savedHighContrast) {
      this.highContrast.set(savedHighContrast === 'true');
    }
  }

  increaseFont() {
    this.fontSize.update((curr) => Math.min(curr + 5, 125));
  }

  decreaseFont() {
    this.fontSize.update((curr) => Math.max(curr - 5, 85));
  }

  toggleHighContrast() {
    this.highContrast.update((curr) => !curr);
  }
}
