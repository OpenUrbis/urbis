import { Route, Switch } from "wouter";
import { AuthProvider } from "./auth/AuthProvider";
import { RequireAuth } from "./components/AccessControl/RequireAuth";
import { LegisLayout } from "./components/layout/legis-layout";
import Home from "./pages/Home";
import PageEditor from "./pages/PageEditor";
import PageView from "./pages/PageView";
import { useAuthCallback } from "@open-urbis/map-auth";
import { Toaster } from "sonner";
import { AuthoritiesProvider } from "./contexts/authorities-context";

/**
 * Passive callback screen: `AuthProvider` finishes the code exchange, redirects
 * to the originating route and recovers from failures. This page only reports
 * progress — duplicating that logic here restarts the flow twice and loops.
 */
function AuthCallback() {
  const { status } = useAuthCallback();

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen gap-4">
      {status === "failed" ? (
        <>
          <p className="text-sm font-medium">
            Não foi possível concluir a autenticação.
          </p>
          <p className="text-sm text-muted-foreground">
            Tente novamente ou entre em contato com o suporte.
          </p>
        </>
      ) : (
        <>
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <p className="text-muted-foreground animate-pulse">
            Finalizando autenticação...
          </p>
        </>
      )}
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AuthoritiesProvider>
        <Toaster />
        <Switch>
          <Route path="/callback" component={AuthCallback} />
          <Route path="/silent-renew.html">
            <div />
          </Route>
          <Route>
            <LegisLayout>
              <Switch>
                <Route path="/" component={Home} />

                {/* Pages CRUD Routes */}
                <Route path="/pages" component={Home} />
                <Route path="/pages/new">
                  <RequireAuth>
                    <PageEditor mode="create" />
                  </RequireAuth>
                </Route>
                <Route path="/pages/:id" component={PageView} />
                <Route path="/pages/:id/edit">
                  <RequireAuth>
                    <PageEditor mode="edit" />
                  </RequireAuth>
                </Route>

                <Route>
                  <div className="flex items-center justify-center h-full">
                    <h1 className="text-2xl font-bold">
                      404 - Página não encontrada
                    </h1>
                  </div>
                </Route>
              </Switch>
            </LegisLayout>
          </Route>
        </Switch>
      </AuthoritiesProvider>
    </AuthProvider>
  );
}
