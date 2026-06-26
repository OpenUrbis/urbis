import { AuthProvider as OidcProvider, useAuth } from "react-oidc-context";
import { userManager } from "../../auth/oidc-config";
import { ReactNode, useEffect } from "react";
import { UserSync } from "../../auth/UserSync";

const AuthCheck = ({ children }: { children: ReactNode }) => {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated && !auth.activeNavigator && !auth.error) {
      auth.signinSilent().catch(() => {
        // Silent sign-in failed, usually means no session exists at the provider
        // We don't need to do anything here, the user remains unauthenticated
      });
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.activeNavigator, auth.error, auth]);

  return <>{children}</>;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const onSigninCallback = () => {
    window.location.href = "/";
  };

  return (
    <OidcProvider userManager={userManager} onSigninCallback={onSigninCallback}>
      <AuthCheck>
        <UserSync />
        {children}
      </AuthCheck>
    </OidcProvider>
  );
};
