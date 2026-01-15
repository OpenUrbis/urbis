import "preact/debug";


import { render } from "preact";
import { DebuggerComponent } from "./components/DebuggerComponent";
import { MapProvider } from "./context/mapContext";
import { NavigationProvider } from "./context/navigationContext";
import { SearchProvider } from "./context/searchContext";
import "./style.css";

const App = () => (
  <NavigationProvider>
    <MapProvider>
      <SearchProvider>
        <div>Test</div>
        <DebuggerComponent />
      </SearchProvider>
    </MapProvider>
  </NavigationProvider>
);

render(<App />, document.getElementById("app")!);
