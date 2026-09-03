import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable, switchMap } from 'rxjs';
import { environment } from '../../../../../../../src/environments/environment';
import { AUTH_CONFIG_ID } from '../../auth.config';

@Injectable({ providedIn: 'root' })
export class AccessTokenInterceptor implements HttpInterceptor {
  oidcSecurityService = inject(OidcSecurityService);

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    if (req.headers.get('DISABLE_INTERCEPTORS') === 'true') {
      return next.handle(req);
    }
    return this.oidcSecurityService.getAccessToken(AUTH_CONFIG_ID).pipe(
      switchMap((token) => {
        let requestToForward = req;
        const header: any = {};
        if (
          token !== undefined &&
          token !== null &&
          !req.url.includes('2fa') &&
          req.url.includes(environment.api)
        ) {
          let tokenValue = 'Bearer ' + token;
          if (!req.url.includes('oidc')) {
            header['Authorization'] = tokenValue;
          }
          const orgByLocalStorage = localStorage.getItem(
            'organization-seleted',
          );

          if (
            orgByLocalStorage &&
            orgByLocalStorage != 'undefined' &&
            !req.url.includes('oidc')
          ) {
            const org = JSON.parse(orgByLocalStorage);
            if (org?.id) header['x-organization-id'] = org?.id;
          }

          requestToForward = req.clone({
            setHeaders: header,
          });
        }

        return next.handle(requestToForward);
      }),
    );
  }
}
