import "preact/debug";

import { setUrbisConfig } from "@open-urbis/map-ui";
import { initPostHog } from "@open-urbis/map-shared";
import "./globals.css";

// Inicializar PostHog Analytics
initPostHog({ appName: "Urbis Map Web" });

// Configurar API global para componentes do packages/ui
setUrbisConfig({
  apiUrl: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

import { Loader2 } from "lucide-react";
import { render } from "preact";
import { lazy, Suspense } from "react";
import { Route, Router } from "wouter";

import { QueryClient, QueryClientProvider } from "@preact-signals/query";

import { RequireAdmin } from "./components/AccessControl/RequireAdmin";
import { AuthProvider } from "./components/AuthProvider";
import { ThemeProvider } from "./components/ThemeProvider";

import { MapProvider } from "./context/MapContext";
import { NavigationProvider } from "./context/NavigationContext";
import { PolygonEditProvider } from "./context/PolygonEditContext";
import { SearchProvider } from "./context/SearchContext";

import { Toaster } from "@/components/ui/toaster";

// ✅ Provider do sidebar global (pra useSidebar funcionar em qualquer página)
import { SidebarProvider } from "@open-urbis/map-ui";
import { DynamicSystemProvider } from "@open-urbis/map";

const MapPage = lazy(() => import("./pages/Map"));
const PrintPage = lazy(() => import("./pages/Print"));
const AdminPage = lazy(() => import("./pages/Admin"));
const ViewTemplateEditorPage = lazy(() => import("./pages/ViewTemplateEditor"));
const ViewTemplatePreviewPage = lazy(
  () => import("./pages/ViewTemplatePreview"),
);
const MapDataTestPage = lazy(() => import("./pages/MapDataTest"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      cacheTime: 0,
      retry: 2,
    },
  },
});

const FullscreenLoader = () => (
  <div className="flex h-[100vh] w-full items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <AuthProvider>
    <ThemeProvider defaultTheme="dark" storageKey="urbis-ui-theme">
      <QueryClientProvider client={queryClient}>
        <SidebarProvider>
          <NavigationProvider>
            <MapProvider>
              <SearchProvider>
                <PolygonEditProvider>
                  <DynamicSystemProvider>
                    {/* 🔥 Layout principal */}
                    <div className="min-h-screen flex flex-col">
                      <a
                        href="#main-content"
                        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[10200] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        Saltar para o conteúdo principal
                      </a>
                      {/* Conteúdo */}
                      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
                        <Router>
                          <Suspense fallback={<FullscreenLoader />}>
                            <Route path="/callback">
                              <FullscreenLoader />
                            </Route>

                            <Route path="/">
                              <MapPage />
                            </Route>

                            <Route path="/print">
                              <RequireAdmin>
                                <PrintPage />
                              </RequireAdmin>
                            </Route>

                            <Route path="/map-data-test">
                              <RequireAdmin>
                                <MapDataTestPage />
                              </RequireAdmin>
                            </Route>

                            <Route path="/admin" nest>
                              <RequireAdmin>
                                <AdminPage />
                              </RequireAdmin>
                            </Route>

                            <Route path="/view-template">
                              <RequireAdmin>
                                <ViewTemplateEditorPage />
                              </RequireAdmin>
                            </Route>

                            <Route path="/view-template/preview">
                              <RequireAdmin>
                                <ViewTemplatePreviewPage />
                              </RequireAdmin>
                            </Route>
                          </Suspense>
                        </Router>
                      </main>
                    </div>
                  </DynamicSystemProvider>
                </PolygonEditProvider>
              </SearchProvider>
            </MapProvider>
          </NavigationProvider>

          <Toaster />
        </SidebarProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </AuthProvider>
);

render(<App />, document.getElementById("app")!);
