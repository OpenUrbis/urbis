import {
  UserManager,
  WebStorageStateStore,
  UserManagerSettings,
} from "oidc-client-ts";

export const DEFAULT_AUTH_CALLBACK_PATH = "/callback";

export interface OidcConfigOptions {
  authority: string;
  clientId: string;
  redirectUri: string;
  silentRedirectUri: string;
  postLogoutRedirectUri?: string;
  scope?: string;
  loadUserInfo?: boolean;
  automaticSilentRenew?: boolean;
  monitorSession?: boolean;
}

export const createOidcConfig = (
  options: OidcConfigOptions,
): UserManagerSettings => {
  const {
    authority,
    clientId,
    redirectUri,
    silentRedirectUri,
    postLogoutRedirectUri,
    scope = "openid profile email",
    loadUserInfo = true,
    automaticSilentRenew = true,
    monitorSession = false,
  } = options;

  return {
    authority,
    client_id: clientId,
    redirect_uri: redirectUri,
    silent_redirect_uri: silentRedirectUri,
    post_logout_redirect_uri:
      postLogoutRedirectUri || authority.replace("/oidc", "/global-logout"),
    scope,
    loadUserInfo,
    automaticSilentRenew,
    monitorSession,
    userStore:
      typeof window !== "undefined"
        ? new WebStorageStateStore({ store: window.localStorage })
        : undefined,
  };
};

export const createUserManager = (options: OidcConfigOptions) => {
  return new UserManager(createOidcConfig(options));
};

/**
 * Derives the callback route from the configured `redirect_uri` so that routing
 * and auth handling can never drift apart. Hardcoding `/callback` while an app
 * is configured with a different redirect URI makes the callback handling run
 * on the wrong route (or never run at all).
 */
export const getAuthCallbackPath = (redirectUri?: string): string => {
  if (!redirectUri) return DEFAULT_AUTH_CALLBACK_PATH;

  const base =
    typeof window === "undefined" ? "http://localhost" : window.location.origin;

  try {
    return new URL(redirectUri, base).pathname || DEFAULT_AUTH_CALLBACK_PATH;
  } catch {
    return DEFAULT_AUTH_CALLBACK_PATH;
  }
};
