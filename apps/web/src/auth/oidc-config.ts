import { UserManager, WebStorageStateStore } from "oidc-client-ts";

const getRedirectUri = (uri: string | undefined, defaultUri: string) => {
  if (uri && !uri.startsWith("http")) {
    return `${window.location.origin}${uri}`;
  }
  return uri || defaultUri;
};

export const oidcConfig = {
  authority: import.meta.env.VITE_OIDC_AUTHORITY || "http://localhost:3000/auth/oidc",
  client_id: import.meta.env.VITE_OIDC_CLIENT_ID || "94a86322-269e-44df-803a-534c0382215d",
  redirect_uri: getRedirectUri(
    import.meta.env.VITE_OIDC_REDIRECT_URI,
    "http://localhost:5173/callback"
  ),
  silent_redirect_uri: getRedirectUri(
    import.meta.env.VITE_OIDC_SILENT_REDIRECT_URI,
    "http://localhost:5173/silent-renew.html"
  ),
  automaticSilentRenew: true,
  scope: "openid profile email",
  loadUserInfo: true,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
};

export const userManager = new UserManager(oidcConfig);
