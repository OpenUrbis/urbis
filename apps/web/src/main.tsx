import "preact/debug";

import "@open-urbis/map-ui";
import { QueryClient, QueryClientProvider } from "@preact-signals/query";
import "bootstrap/dist/css/bootstrap.css";
import { render } from "preact";
import { ReactNode } from "react";
import { Debugger } from "./components/Debugger";
import { LayerController } from "./components/LayerController";
import { LeftNav } from "./components/LeftNav";
import { MapLegend } from "./components/MapLegend";
import { MapView } from "./components/MapView/MapView";
import { MapProvider } from "./context/MapContext";
import { NavigationProvider } from "./context/NavigationContext";
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
              <LeftNav />
              <MapLegend />
              <LayerController />
              <MapView />
              <Debugger />
            </SearchProvider>
          </MapProvider>
        </NavigationProvider>
      ) as ReactNode
    }
  </QueryClientProvider>
);

render(<App />, document.getElementById("app")!);
