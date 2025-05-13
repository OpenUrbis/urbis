import "preact/debug";

import "@open-urbis/map-ui";
import { QueryClient, QueryClientProvider } from "@preact-signals/query";
import "bootstrap/dist/css/bootstrap.css";
import { render } from "preact";
import { lazy, Suspense } from "preact/compat";
import "preact/debug";
import { ReactNode } from "react";
import { CircularProgress } from "rmwc";
import { Route, Router } from "wouter";
import { MapProvider } from "./context/MapContext";
import { NavigationProvider } from "./context/NavigationContext";
import { PolygonEditProvider } from "./context/PolygonEditContext";
import { SearchProvider } from "./context/SearchContext";

const MapPage = lazy(() => import("./pages/Map"));
const PrintPage = lazy(() => import("./pages/Print"));

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
  <div id="app">
    <QueryClientProvider client={queryClient}>
      {
        (
          <NavigationProvider>
            <MapProvider>
              <SearchProvider>
                <PolygonEditProvider>
                  <Router>
                    {
                      (
                        <Suspense
                          fallback={
                            <div className="h-100 w-100 d-flex align-items-center justify-content-center">
                              <CircularProgress
                                label="progress"
                                size="xlarge"
                              />
                            </div>
                          }
                        >
                          <Route path="/">{(<MapPage />) as ReactNode}</Route>
                          <Route path="/print">
                            {(<PrintPage />) as ReactNode}
                          </Route>
                        </Suspense>
                      ) as ReactNode
                    }
                  </Router>
                </PolygonEditProvider>
              </SearchProvider>
            </MapProvider>
          </NavigationProvider>
        ) as ReactNode
      }
    </QueryClientProvider>
  </div>
);

render(<App />, document.getElementById("app")!);
