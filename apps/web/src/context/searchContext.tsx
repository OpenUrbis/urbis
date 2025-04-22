import { signal } from "@preact/signals";
import { ComponentChildren, createContext } from "preact";
import { useContext } from "preact/hooks";
import { SearchContextType, SearchMultiResult } from "../types/search-context-type";

const currentTerm = signal<string>("");
const lastTerm = signal<string>("");
const history = signal<string[]>([]);
const results = signal<SearchMultiResult>({
  districts: [],
  geocoding: [],
  lots: [],
});

const searchState: SearchContextType = {
  currentTerm,
  lastTerm,
  history,
  results,
};

export const SearchContext = createContext<SearchContextType>(searchState);

export const useSearchContext = () => {
  const context = useContext(SearchContext);

  // Logica

  if (!context)
    throw new Error("useSearchContext must be used within a SearchProvider");

  return context;
};

export const SearchProvider = ({
  children,
}: {
  children: ComponentChildren;
}) => {
  return (
    <SearchContext.Provider value={searchState}>
      {children}
    </SearchContext.Provider>
  );
};
