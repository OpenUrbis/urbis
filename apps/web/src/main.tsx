import { render } from 'preact';
import { MapProvider } from "./context/mapContext";
import "./style.css";

const App = () => (
  <>
    <MapProvider>
      <div>test</div>
    </MapProvider>
  </>
);

render(<App />, document.getElementById("app")!);