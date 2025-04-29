import { effect, signal } from "@preact/signals";
import { ComponentChildren, createContext } from "preact";
import { useFetchSearch } from "../hooks/useFetchSearch";
import { IGetSearchConfigResponse } from "../types/fetch-search-config-type";
import { SearchContextType } from "../types/search-context-type";

const currentTerm = signal<string>("");
const lastTerm = signal<string>("");
const history = signal<string[]>([]);
const searchConfig = signal<IGetSearchConfigResponse[]>([]);

export const SearchContext = createContext<SearchContextType | null>(null);

export const SearchProvider = ({
  children,
}: {
  children: ComponentChildren;
}) => {
  const searchQuery = useFetchSearch(searchConfig);

  effect(() => {
    const term = currentTerm.peek();

    if (history.value[0] !== lastTerm.value) {
      lastTerm.value = history.value[0];
    }

    if (term && !history.value.includes(term)) {
      history.value = [term, ...history.value];
    }
  });

  return (
    <SearchContext.Provider
      value={{
        currentTerm,
        lastTerm,
        history,
        searchQuery,
        searchConfig,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
