import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';

import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideAuth } from 'angular-auth-oidc-client';
import { RECAPTCHA_V3_SITE_KEY } from 'ng-recaptcha-2';
import {
  authConfig,
  externalOidcAuthConfig,
} from '../../projects/shared/src/lib/auth/auth.config';
import { AccessTokenInterceptor } from '../../projects/shared/src/lib/auth/interceptors/access-token/access-token-interceptor';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { MatPaginatorI18n } from './shared/table/mat-paginator-i18n';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideAuth({ config: [authConfig, externalOidcAuthConfig] }),
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: RECAPTCHA_V3_SITE_KEY,
      useValue: environment.googleRecaptchaSiteKey,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AccessTokenInterceptor,
      multi: true,
    },
    {
      provide: MatPaginatorIntl,
      useClass: MatPaginatorI18n,
      deps: [TranslateService],
    },
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: '/i18n/',
        suffix: '.json',
      }),
      fallbackLang: 'pt',
      lang: 'pt',
    }),
  ],
};
