import "preact/debug";

import "@open-urbis/map-ui";
import "bootstrap/dist/css/bootstrap.css";
import { render } from "preact";
import { DebuggerComponent } from "./components/DebuggerComponent/DebuggerComponent";
import { FeaturesViewComponent } from "./components/FeaturesViewComponent";
import { LayerController } from "./components/LayerController";
import MapView from "./components/MapView/MapView";
import { MapProvider } from "./context/MapContext/mapContext";
import { NavigationProvider } from "./context/navigationContext";
import { SearchProvider } from "./context/searchContext";

const App = () => (
  <NavigationProvider>
    <MapProvider>
      <SearchProvider>
        <div>
          <FeaturesViewComponent />
          <LayerController />
          <MapView />
        </div>
        <DebuggerComponent />
      </SearchProvider>
    </MapProvider>
  </NavigationProvider>
);

render(<App />, document.getElementById("app")!);
