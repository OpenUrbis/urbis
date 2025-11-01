import { LogLevel, PassedInitialConfig } from 'angular-auth-oidc-client';
import { environment } from '../../../../../src/environments/environment';

export const authConfig: PassedInitialConfig = {
  config: {
    secureRoutes: [environment.api],
    authority: environment.api + '/auth/oidc',
    forbiddenRoute: '/forbidden',
    unauthorizedRoute: '/unauthorized',
    refreshTokenRetryInSeconds: 10,
    logLevel: LogLevel.Debug,
    redirectUrl: `${window.location.origin}/callback`,
    postLogoutRedirectUri: window.location.origin,
    clientId: environment.clientId,
    scope: 'openid profile offline_access',
    responseType: 'code',
    maxIdTokenIatOffsetAllowedInSeconds: 4200,
    ignoreNonceAfterRefresh: true,
    silentRenew: true,
    silentRenewUrl: `${window.location.origin}/silent-renew.html`,
    renewTimeBeforeTokenExpiresInSeconds: 600,
  },
};
