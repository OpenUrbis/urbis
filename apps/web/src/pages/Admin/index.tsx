import "preact/debug";

import "@open-urbis/map-ui";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import "preact/debug";
import { lazy, ReactNode, Suspense } from "react";
import { Route, Router } from "wouter";
import { MainLayout } from "../../components/MainLayout";

const LayerHandleRoute = lazy(
  () => import("./pages/LayerManager/LayerHandleRoute"),
);
const GroupHandleRoute = lazy(
  () => import("./pages/GroupManager/GroupHandleRoute"),
);
const SearchHandleRoute = lazy(
  () => import("./pages/SearchManager/SearchHandleRoute"),
);
const MapConfigHandleRoute = lazy(
  () => import("./pages/MapConfigManager/MapConfigHandleRoute"),
);
const MapTestRoute = lazy(() => import("./pages/MapTest"));
const MapDataIntegrationTestRoute = lazy(
  () => import("./pages/MapDataIntegrationTest"),
);
const DiagnosticsRoute = lazy(() => import("./pages/Diagnostics"));

const AdminWelcomePage = () => {
  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <section className="w-full max-w-2xl rounded-xl border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">
          Bem-vindo ao Admin do mapa
        </h1>
        <p className="mt-2 text-muted-foreground">
          Aqui você pode configurar as camadas, grupos e outras opções do mapa.
        </p>
        <Button asChild className="mt-6 gap-2">
          <a
            href="https://conta.urbis.prefeitura.sp.gov.br"
            target="_blank"
            rel="noreferrer"
          >
            Ir para o admin de contas
            <ArrowRight className="h-4 w-4" />
          </a>
        </Button>
      </section>
    </div>
  );
};

const AdminPage = () => {
  return (
    <MainLayout>
      <Router>
        {
          (
            <Suspense
              fallback={
                <div className="h-screen w-screen flex items-center justify-center">
                  <Loader2 className="h-10 w-10 animate-spin" />
                </div>
              }
            >
              <Route path="/">
                <AdminWelcomePage />
              </Route>
              <Route path="/layer-manager" nest>
                {(<LayerHandleRoute />) as ReactNode}
              </Route>
              <Route path="/group-manager" nest>
                {(<GroupHandleRoute />) as ReactNode}
              </Route>
              <Route path="/search-manager" nest>
                {(<SearchHandleRoute />) as ReactNode}
              </Route>
              <Route path="/map-config-manager" nest>
                {(<MapConfigHandleRoute />) as ReactNode}
              </Route>
              <Route path="/map-test">{(<MapTestRoute />) as ReactNode}</Route>
              <Route path="/map-data-test">
                {(<MapDataIntegrationTestRoute />) as ReactNode}
              </Route>
              <Route path="/diagnostics">
                {(<DiagnosticsRoute />) as ReactNode}
              </Route>
            </Suspense>
          ) as ReactNode
        }
      </Router>
    </MainLayout>
  );
};

export default AdminPage;
