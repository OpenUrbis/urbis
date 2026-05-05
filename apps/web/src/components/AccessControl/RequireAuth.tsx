import { Loader2 } from 'lucide-react';
import { ReactNode, useEffect } from 'react';
import { useAuth } from 'react-oidc-context';

export const RequireAuth = ({ children }: { children: ReactNode }) => {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      void auth.signinRedirect();
    }
  }, [auth.isLoading, auth.isAuthenticated, auth]);

  if (auth.isLoading || !auth.isAuthenticated) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
};
