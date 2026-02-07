import { AuthProvider as OidcProvider, useAuth } from "react-oidc-context";
import { UserSync } from "./UserSync";
import { ReactNode, useEffect } from "react";
import { UserManager } from "oidc-client-ts";

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

interface AuthProviderProps {
  children: ReactNode;
  userManager: UserManager;
  apiUrl: string;
}

export const AuthProvider = ({ children, userManager, apiUrl }: AuthProviderProps) => {
  const onSigninCallback = () => {
    window.location.href = "/";
  };

  return (
    <OidcProvider userManager={userManager} onSigninCallback={onSigninCallback}>
      <AuthCheck>
        <UserSync apiUrl={apiUrl} />
        {children}
      </AuthCheck>
    </OidcProvider>
  );
};
