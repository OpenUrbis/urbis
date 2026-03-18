import "preact/debug";

import { setUrbisConfig } from "@open-urbis/map-ui";
import "./globals.css";

// Configurar API global para componentes do packages/ui
setUrbisConfig({
  apiUrl: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

import { Loader2 } from "lucide-react";
import { render } from "preact";
import { lazy, Suspense } from "react";
import { Route, Router } from "wouter";

import { QueryClient, QueryClientProvider } from "@preact-signals/query";

import { RequireAuth } from "./components/AccessControl/RequireAuth";
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
  <div className="h-screen w-screen flex items-center justify-center">
    <Loader2 className="h-10 w-10 animate-spin" />
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
                      {/* Conteúdo */}
                      <main className="flex-1">
                        <Router>
                          <Suspense fallback={<FullscreenLoader />}>
                            <Route path="/callback">
                              <FullscreenLoader />
                            </Route>

                            <Route path="/">
                              <MapPage />
                            </Route>

                            <Route path="/print">
                              <PrintPage />
                            </Route>

                            <Route path="/map-data-test">
                              <MapDataTestPage />
                            </Route>

                            <Route path="/admin" nest>
                              <RequireAuth>
                                <AdminPage />
                              </RequireAuth>
                            </Route>

                            <Route path="/view-template">
                              <ViewTemplateEditorPage />
                            </Route>

                            <Route path="/view-template/preview">
                              <ViewTemplatePreviewPage />
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
