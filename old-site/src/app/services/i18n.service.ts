import { inject, Injectable, LOCALE_ID, signal } from '@angular/core';
import { Language, languages } from './i18n.utils';

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  languages = signal<Language[]>(languages);
  currentLanguage = inject(LOCALE_ID);

  constructor() { }

  updateRoute(newLanguage: string) {
    const subroutes = location.href.split('/').splice(3);
    let languageRoute = subroutes[0];
    const hasAnotherLanguageRoutePrefix = this.languages().find(
      (language) => language.isoCode === languageRoute,
    );

    if (hasAnotherLanguageRoutePrefix) {
      subroutes.shift();
    }

    const newRoute = `/${newLanguage}/${subroutes.join('/')}`;
    location.href = newRoute;
  }
}
