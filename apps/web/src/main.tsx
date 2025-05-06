import "preact/debug";

import "@open-urbis/map-ui";
import { QueryClient, QueryClientProvider } from "@preact-signals/query";
import "bootstrap/dist/css/bootstrap.css";
import { render } from "preact";
import { ReactNode } from "react";
import { Debugger } from "./components/Debugger";
import Header from "./components/Header";
import { LeftNav } from "./components/LeftNav";
import { MapLegend } from "./components/MapLegend";
import { MapView } from "./components/MapView";
import { MapProvider } from "./context/MapContext";
import { NavigationProvider } from "./context/NavigationContext";
import { PolygonEditProvider } from "./context/PolygonEditContext";
import { SearchProvider } from "./context/SearchContext";

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
  <QueryClientProvider client={queryClient}>
    {
      (
        <NavigationProvider>
          <MapProvider>
            <SearchProvider>
              <PolygonEditProvider>
                <div id="app">
                  <header className="app-header">
                    <Header />
                  </header>
                  <div className="map-container">
                    <LeftNav />
                    <div className="map-view">
                      <MapLegend />
                      <Debugger />
                      <MapView />
                    </div>
                  </div>
                </div>
              </PolygonEditProvider>
            </SearchProvider>
          </MapProvider>
        </NavigationProvider>
      ) as ReactNode
    }
  </QueryClientProvider>
);

render(<App />, document.getElementById("app")!);
