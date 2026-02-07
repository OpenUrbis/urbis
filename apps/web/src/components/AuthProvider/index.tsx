import { AuthProvider as SharedAuthProvider } from "@open-urbis/map-auth";
import { userManager } from "../../auth/oidc-config";
import { ReactNode } from "react";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  return (
    <SharedAuthProvider
      userManager={userManager}
      apiUrl={import.meta.env.VITE_API_URL || "http://localhost:3000"}
    >
      {children}
    </SharedAuthProvider>
  );
};
