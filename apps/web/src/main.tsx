import "preact/debug";

import "@open-urbis/map-ui";
import "bootstrap/dist/css/bootstrap.css";
import { render } from "preact";
import { Debugger } from "./components/Debugger";
import { FeaturesView } from "./components/FeaturesView";
import { LayerController } from "./components/LayerController";
import { MapView } from "./components/MapView/MapView";
import { MapProvider } from "./context/MapContext";
import { NavigationProvider } from "./context/NavigationContext";
import { SearchProvider } from "./context/SearchContext";

const App = () => (
  <NavigationProvider>
    <MapProvider>
      <SearchProvider>
        <div>
          <FeaturesView />
          <LayerController />
          <MapView />
        </div>
        <Debugger />
      </SearchProvider>
    </MapProvider>
  </NavigationProvider>
);

render(<App />, document.getElementById("app")!);
