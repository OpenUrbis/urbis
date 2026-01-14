import { LogLevel, OpenIdConfiguration } from 'angular-auth-oidc-client';
import { environment } from '../../../../../src/environments/environment';

export const AUTH_CONFIG_ID = '718acb98-5696-48a6-881a-2ae454b71e16';
export const EXTERNAL_OIDC_AUTH_CONFIG_ID = '2c131fd6-3cf1-4275-b829-ff4a0813223d';

const commomAuthConfig: Partial<OpenIdConfiguration> = {
  forbiddenRoute: '/forbidden',
  unauthorizedRoute: '/unauthorized',
  refreshTokenRetryInSeconds: 10,
  logLevel: LogLevel.Error,
  postLogoutRedirectUri: window.location.origin,
  scope: 'openid profile email offline_access',
  responseType: 'code',
  maxIdTokenIatOffsetAllowedInSeconds: 4200,
  ignoreNonceAfterRefresh: true,
  silentRenew: true,
  silentRenewUrl: `${window.location.origin}/silent-renew.html`,
  renewTimeBeforeTokenExpiresInSeconds: 600,
};

export const authConfig: OpenIdConfiguration = {
  ...commomAuthConfig,
  configId: AUTH_CONFIG_ID,
  secureRoutes: [environment.api],
  authority: environment.api + '/auth/oidc',
  redirectUrl: `${window.location.origin}/callback`,
  clientId: environment.appClientId,
};

export const externalOidcAuthConfig: OpenIdConfiguration = {
  ...commomAuthConfig,
  configId: EXTERNAL_OIDC_AUTH_CONFIG_ID,
  secureRoutes: environment.externalOidcSecureRoutes,
  authority: environment.externalOidcAuthority,
  redirectUrl: `${window.location.origin}/callback`,
  authWellknownUrlSuffix: '/.well-known/openid-configuration',
  clientId: environment.externalOidcClientId,
  triggerAuthorizationResultEvent: true,
};
