import { createUserManager, createOidcConfig } from "@open-urbis/map-auth";

const getRedirectUri = (uri: string | undefined, defaultUri: string) => {
  if (uri && !uri.startsWith("http")) {
    return `${window.location.origin}${uri}`;
  }
  return uri || defaultUri;
};

const authority =
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  import.meta.env.VITE_OIDC_AUTHORITY || "http://localhost:3000/auth/oidc";

const configOptions = {
  authority,
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  clientId:
    import.meta.env.VITE_OIDC_CLIENT_ID ||
    "94a86322-269e-44df-803a-534c0382215d",
  redirectUri: getRedirectUri(
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    import.meta.env.VITE_OIDC_REDIRECT_URI,
    "http://localhost:5173/callback",
  ),
  silentRedirectUri: getRedirectUri(
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    import.meta.env.VITE_OIDC_SILENT_REDIRECT_URI,
    "http://localhost:5173/silent-renew.html",
  ),
};

export const oidcConfig = createOidcConfig(configOptions);

export const userManager = createUserManager(configOptions);
