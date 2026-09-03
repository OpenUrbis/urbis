import { AuthProvider, createUserManager } from "@open-urbis/map-auth";
import { Outlet } from "react-router-dom";

const origin =
  typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:5174";

const userManager =
  typeof window !== "undefined"
    ? createUserManager({
        authority:
          import.meta.env.VITE_OIDC_AUTHORITY ||
          "http://localhost:3000/auth/oidc",
        clientId:
          import.meta.env.VITE_OIDC_CLIENT_ID ||
          "0375600b-cd37-4b89-82e1-68fd374b83e8",
        redirectUri:
          import.meta.env.VITE_OIDC_REDIRECT_URI || `${origin}/callback`,
        silentRedirectUri:
          import.meta.env.VITE_OIDC_SILENT_REDIRECT_URI ||
          `${origin}/silent-renew.html`,
      })
    : null;

export const GlobalProvider = () => {
  if (!userManager) {
    return <Outlet />;
  }

  return (
    <AuthProvider
      userManager={userManager}
      apiUrl={import.meta.env.VITE_API_URL || "http://localhost:3000"}
    >
      <Outlet />
    </AuthProvider>
  );
};
