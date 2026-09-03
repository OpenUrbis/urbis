import { Loader2 } from "lucide-react";
import { ReactNode } from "react";
import { RequireAuth as SharedRequireAuth } from "@open-urbis/map-auth";

const AuthStatus = ({ children }: { children: ReactNode }) => (
  <div className="h-screen w-screen flex flex-col items-center justify-center gap-4">
    {children}
  </div>
);

export const RequireAuth = ({ children }: { children: ReactNode }) => {
  return (
    <SharedRequireAuth
      fallback={
        <AuthStatus>
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">
            Verificando autenticação...
          </p>
        </AuthStatus>
      }
      errorFallback={
        <AuthStatus>
          <p className="text-sm font-medium">Não foi possível autenticar.</p>
          <p className="text-sm text-muted-foreground">
            Tente novamente ou entre em contato com o suporte.
          </p>
        </AuthStatus>
      }
    >
      {children}
    </SharedRequireAuth>
  );
};
