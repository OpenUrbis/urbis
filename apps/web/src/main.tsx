import "preact/debug";

import "@open-urbis/map-ui";
import "./globals.css";

import { render } from "preact";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Route, Router } from "wouter";

import { QueryClient, QueryClientProvider } from "@preact-signals/query";

import { ThemeProvider } from "./components/ThemeProvider";
import { AuthProvider } from "./components/AuthProvider";
import { RequireAuth } from "./components/AccessControl/RequireAuth";

import { MapProvider } from "./context/MapContext";
import { NavigationProvider } from "./context/NavigationContext";
import { PolygonEditProvider } from "./context/PolygonEditContext";
import { SearchProvider } from "./context/SearchContext";

import { Toaster } from "@/components/ui/toaster";

// ✅ Provider do sidebar global (pra useSidebar funcionar em qualquer página)
import { SidebarProvider } from "@open-urbis/map-ui";

const MapPage = lazy(() => import("./pages/Map"));
const PrintPage = lazy(() => import("./pages/Print"));
const AdminPage = lazy(() => import("./pages/Admin"));

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
    <div id="app">
      <ThemeProvider defaultTheme="dark" storageKey="urbis-ui-theme">
        <QueryClientProvider client={queryClient}>
          <SidebarProvider>
            <NavigationProvider>
              <MapProvider>
                <SearchProvider>
                  <PolygonEditProvider>
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

                        <Route path="/admin" nest>
                          <RequireAuth>
                            <AdminPage />
                          </RequireAuth>
                        </Route>
                      </Suspense>
                    </Router>
                  </PolygonEditProvider>
                </SearchProvider>
              </MapProvider>
            </NavigationProvider>

            <Toaster />
          </SidebarProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </div>
  </AuthProvider>
);

render(<App />, document.getElementById("app")!);
