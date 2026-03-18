import { Loader2 } from "lucide-react";
import { ReactNode, useEffect } from "react";
import { useAuth } from "@open-urbis/map-auth";

export const RequireAuth = ({ children }: { children: ReactNode }) => {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated && !auth.activeNavigator) {
      void auth.signinRedirect();
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.activeNavigator, auth]);

  if (auth.isLoading || !auth.isAuthenticated) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Verificando autenticação...</p>
      </div>
    );
  }

  return <>{children}</>;
};
