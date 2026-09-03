import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';

import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import {
  AbstractSecurityStorage,
  DefaultLocalStorageService,
  OidcSecurityService,
  provideAuth,
} from 'angular-auth-oidc-client';
import { RECAPTCHA_V3_SITE_KEY } from 'ng-recaptcha-2';
import { firstValueFrom } from 'rxjs';
import {
  authConfig,
  externalOidcAuthConfig,
} from '../../projects/shared/src/lib/auth/auth.config';
import { AccessTokenInterceptor } from '../../projects/shared/src/lib/auth/interceptors/access-token/access-token-interceptor';
import { environment } from '../environments/environment';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideAuth({ config: [authConfig, externalOidcAuthConfig] }),
    provideAppInitializer(() => {
      const oidcSecurityService = inject(OidcSecurityService);
      return firstValueFrom(oidcSecurityService.checkAuthMultiple());
    }),
    {
      provide: AbstractSecurityStorage,
      useClass: DefaultLocalStorageService,
    },
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
