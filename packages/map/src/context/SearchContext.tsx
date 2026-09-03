import { effect, signal } from "@preact/signals";
import { createContext, ReactNode, useEffect } from "react";
import { useFetchSearch } from "../hooks/useFetchSearch";
import { getSearchConfig } from "../integrations/search-integration";
import { IGetSearchConfigResponse } from "../types/fetch-search-config-type";
import { SearchContextType } from "../types/search-context-type";

const currentTerm = signal<string>("");
const lastTerm = signal<string>("");
const history = signal<string[]>([]);
const searchConfig = signal<IGetSearchConfigResponse[]>([]);
const concatenatedSearch = signal({
  selectedLayerId: "",
  filterTree: {
    id: "root",
    type: "group",
    operator: "AND",
    children: [],
  } as any,
  results: [],
  totalCount: undefined as number | undefined,
  layerTotalCount: undefined as number | undefined,
  isOpen: false,
});
const isSearchConfigLoaded = signal(false);
const searchConfigError = signal<string | null>(null);

export const SearchContext = createContext<SearchContextType | null>(null);

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const searchQuery = useFetchSearch(searchConfig);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await getSearchConfig();
        if (response) {
          searchConfig.value = response;
        }
      } catch (error) {
        console.error("Error fetching search config:", error);
        searchConfigError.value = String(error);
      } finally {
        isSearchConfigLoaded.value = true;
      }
    };

    loadConfig();
  }, []);

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
        concatenatedSearch,
        isSearchConfigLoaded,
        searchConfigError,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
