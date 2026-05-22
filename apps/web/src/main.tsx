import "preact/debug";

import "@open-urbis/map-ui";
import { QueryClient, QueryClientProvider } from "@preact-signals/query";
import "./globals.css";
import { render } from "preact";
import "preact/debug";
import { lazy, ReactNode, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Route, Router } from "wouter";
import { ThemeProvider } from "./components/ThemeProvider";
import { MapProvider } from "./context/MapContext";
import { NavigationProvider } from "./context/NavigationContext";
import { PolygonEditProvider } from "./context/PolygonEditContext";
import { SearchProvider } from "./context/SearchContext";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./components/AuthProvider";
import { RequireAuth } from "./components/AccessControl/RequireAuth";

const MapPage = lazy(() => import("./pages/Map"));
const PrintPage = lazy(() => import("./pages/Print"));
const AdminPage = lazy(() => import("./pages/Admin"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      cacheTime: 0,
      retry: 2, // Tentar novamente 2 vezes em caso de falha
    },
  },
});

const App = () => (
  <AuthProvider>
    <div id="app">
      <ThemeProvider defaultTheme="dark" storageKey="urbis-ui-theme">
        {
          (
            <QueryClientProvider client={queryClient}>
              {
                (
                  <>
                    <NavigationProvider>
                      <MapProvider>
                        <SearchProvider>
                          <PolygonEditProvider>
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
                                    <Route path="/callback">
                                      <div className="h-screen w-screen flex items-center justify-center">
                                        <Loader2 className="h-10 w-10 animate-spin" />
                                      </div>
                                    </Route>
                                    <Route path="/">{(<MapPage />) as ReactNode}</Route>
                                    <Route path="/print">
                                      {(<PrintPage />) as ReactNode}
                                    </Route>
                                    <Route path="/admin" nest>
                                      <RequireAuth>
                                        {(<AdminPage />) as ReactNode}
                                      </RequireAuth>
                                    </Route>
                                  </Suspense>
                                ) as ReactNode
                              }
                            </Router>
                          </PolygonEditProvider>
                        </SearchProvider>
                      </MapProvider>
                    </NavigationProvider>
                    <Toaster />
                  </>
                ) as ReactNode
              }
            </QueryClientProvider>
          ) as ReactNode
        }
      </ThemeProvider>
    </div>
  </AuthProvider>
);

render(<App />, document.getElementById("app")!);
