import { AuthProvider as OidcProvider } from "react-oidc-context";
import { oidcConfig } from "../../auth/oidc-config";
import { ReactNode } from "react";
import { UserSync } from "../../auth/UserSync";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const onSigninCallback = () => {
    window.location.href = "/";
  };

  return (
    <OidcProvider {...oidcConfig} onSigninCallback={onSigninCallback}>
      <UserSync />
      {children}
    </OidcProvider>
  );
};
