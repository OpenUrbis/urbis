import { Route, Switch, useLocation } from "wouter";
import { AuthProvider } from "./auth/AuthProvider";
import { RequireAuth } from "./components/AccessControl/RequireAuth";
import { LegisLayout } from "./components/layout/legis-layout";
import Home from "./pages/Home";
import PageEditor from "./pages/PageEditor";
import PageView from "./pages/PageView";
import { useEffect } from "react";
import { useAuth } from "@open-urbis/map-auth";
import { Toaster } from "sonner";

function AuthCallback() {
  const auth = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated) {
      setLocation("/");
    }
  }, [auth.isLoading, auth.isAuthenticated, setLocation]);

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      <p className="text-muted-foreground animate-pulse">Finalizando autenticação...</p>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <Toaster />
      <Switch>
        <Route path="/callback" component={AuthCallback} />
        <Route path="/silent-renew.html">
           <div />
        </Route>
        <Route>
          <RequireAuth>
            <LegisLayout>
              <Switch>
                <Route path="/" component={Home} />
                
                {/* Pages CRUD Routes */}
                <Route path="/pages" component={Home} />
                <Route path="/pages/new">
                    <PageEditor mode="create" />
                </Route>
                <Route path="/pages/:id" component={PageView} />
                <Route path="/pages/:id/edit">
                    <PageEditor mode="edit" />
                </Route>

                <Route>
                  <div className="flex items-center justify-center h-full">
                    <h1 className="text-2xl font-bold">404 - Página não encontrada</h1>
                  </div>
                </Route>
              </Switch>
            </LegisLayout>
          </RequireAuth>
        </Route>
      </Switch>
    </AuthProvider>
  );
}
