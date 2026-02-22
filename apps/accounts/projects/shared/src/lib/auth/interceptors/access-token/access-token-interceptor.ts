import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Injectable({ providedIn: 'root' })
export class AccessTokenInterceptor implements HttpInterceptor {
  constructor(private oidcSecurityService: OidcSecurityService) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (req.headers.get('DISABLE_INTERCEPTORS') === 'true') {
      return next.handle(req);
    }
    return this.oidcSecurityService.getAccessToken().pipe(
      switchMap((token) => {
        let requestToForward = req;
        if (token !== undefined && token !== null) {
          let tokenValue = 'Bearer ' + token;
          if (!req.url.includes('oidc/token')) {
            requestToForward = req.clone({
              setHeaders: { Authorization: tokenValue },
            });
          }
        }
        return next.handle(requestToForward);
      })
    );
  }
}
