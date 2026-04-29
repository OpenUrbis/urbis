import { UserManager } from "oidc-client-ts";

export const oidcConfig = {
  authority: import.meta.env.VITE_OIDC_AUTHORITY || "http://localhost:3000/auth/oidc",
  client_id: import.meta.env.VITE_OIDC_CLIENT_ID || "94a86322-269e-44df-803a-534c0382215d",
  redirect_uri: import.meta.env.VITE_OIDC_REDIRECT_URI || "http://localhost:5173/callback",
  scope: "openid profile email",
  loadUserInfo: true,
};

export const userManager = new UserManager(oidcConfig);
