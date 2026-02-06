import { UserManager, WebStorageStateStore, UserManagerSettings } from "oidc-client-ts";

export interface OidcConfigOptions {
  authority: string;
  clientId: string;
  redirectUri: string;
  silentRedirectUri: string;
  postLogoutRedirectUri?: string;
}

export const createOidcConfig = (options: OidcConfigOptions): UserManagerSettings => {
  const { authority, clientId, redirectUri, silentRedirectUri, postLogoutRedirectUri } = options;

  return {
    authority,
    client_id: clientId,
    redirect_uri: redirectUri,
    silent_redirect_uri: silentRedirectUri,
    post_logout_redirect_uri: postLogoutRedirectUri || authority.replace('/oidc', '/global-logout'),
    automaticSilentRenew: true,
    scope: "openid profile email",
    loadUserInfo: true,
    userStore: typeof window !== 'undefined' ? new WebStorageStateStore({ store: window.localStorage }) : undefined,
  };
};

export const createUserManager = (options: OidcConfigOptions) => {
  return new UserManager(createOidcConfig(options));
};
