import "preact/debug";


import { render } from "preact";
import { DebuggerComponent } from "./components/DebuggerComponent";
import { MapProvider } from "./context/mapContext";
import { NavigationProvider } from "./context/navigationContext";
import { SearchProvider } from "./context/searchContext";
import { Button } from '@rmwc/button';
import './style.scss';
import 'rmwc/styles';
import { SimpleDialog } from "rmwc";
import { signal } from '@preact/signals';
// certo
const open = signal<boolean>(false);

function Example() {
  return (
    <>
      <SimpleDialog
        title="This is a simple dialog"
        body="You can pass the body prop or children."
        open={open.value}
        onClose={(evt) => {
          console.log(evt.detail.action);
          open.value = false;
        }}
      />

      <Button raised onClick={() => {
        open.value = true
      }}>
        Open Simple Dialog
      </Button>
    </>
  );
}
const App = () => (
  <NavigationProvider>
    <MapProvider>
      <SearchProvider>
        <div>Test</div>
        <Button></Button>
        <div >
          <Example></Example>
        </div>
        <DebuggerComponent />
      </SearchProvider>
    </MapProvider>
  </NavigationProvider>
);

render(<App />, document.getElementById("app")!);
