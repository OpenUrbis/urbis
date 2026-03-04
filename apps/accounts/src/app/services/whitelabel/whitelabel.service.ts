import { effect, Injectable } from '@angular/core';
import {
  ApplicationTheme,
  DEFAULTS,
  IWhitelabelLocalStorage,
  IWhitelabelState,
} from './whitelabel.types';
import { applyDynamicColorPalette, oppositeTheme } from './whitelabel.utils';
import { StatefulService } from '../../utils/types/stateful-service';

@Injectable({ providedIn: 'root' })
export class WhitelabelService extends StatefulService<IWhitelabelState> {
  constructor() {
    let initialState = {
      ...DEFAULTS.whitelabel,
      loading: false,
    } as IWhitelabelState;

    try {
      const raw = localStorage.getItem('whitelabel');
      if (raw) {
        const parsed: IWhitelabelLocalStorage = JSON.parse(raw);
        initialState = {
          ...initialState,
          ...parsed,
        };
      }
    } catch {
      console.error('[WhitelabelService] ERROR parsing data from localstorage');
    }

    super(initialState);

    effect(() => {
      const primaryColor = this.state().primaryColor;
      if (primaryColor) {
        applyDynamicColorPalette(primaryColor, this.state().theme);
      }

      localStorage.setItem(
        'whitelabel',
        JSON.stringify(this.state() as IWhitelabelLocalStorage),
      );
    });
  }

  toggleTheme() {
    this.setStateProperty('theme', oppositeTheme[this.state().theme]);
  }

  setTheme(desiredTheme: ApplicationTheme) {
    this.setStateProperty('theme', desiredTheme);
  }

  setPrimaryColor(desiredColor: string) {
    this.setStateProperty('primaryColor', desiredColor);
  }
}
