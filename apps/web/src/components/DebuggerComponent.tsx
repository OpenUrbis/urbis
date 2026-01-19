import { useMapContext } from "../context/mapContext";
import { useNavigationContext } from "../context/navigationContext";
import { useSearchContext } from "../context/searchContext";

export const DebuggerComponent = () => {
  const searchContext = useSearchContext();
  const navigationContext = useNavigationContext();
  const mapContext = useMapContext();

  return (
    <div>
      <h1>Debugger</h1>
      <h2>Search Context</h2>
      <pre>{JSON.stringify(searchContext, null, 2)}</pre>
      <h2>Navigation Context</h2>
      <pre>{JSON.stringify(navigationContext, null, 2)}</pre>
      <h2>Map Context</h2>
      <pre>{JSON.stringify(mapContext, null, 2)}</pre>
    </div>
  );
};
