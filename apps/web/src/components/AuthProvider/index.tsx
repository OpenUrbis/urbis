import { AuthProvider as OidcProvider } from "react-oidc-context";
import { oidcConfig } from "../../auth/oidc-config";
import { ReactNode } from "react";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  return <OidcProvider {...oidcConfig}>{children}</OidcProvider>;
};
