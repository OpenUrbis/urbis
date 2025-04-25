import { useQuery$ } from "@preact-signals/query";
import { effect, signal } from "@preact/signals";
import { ComponentChildren, createContext } from "preact";
import { fetchSearchItem } from "../integrations/search-integration";
import {
  IGetSearchConfigResponse,
  IGetSearchItem,
  ISearchResponse,
} from "../types/fetch-search-config-type";
import { SearchContextType } from "../types/search-context-type";

const currentTerm = signal<string>("");
const lastTerm = signal<string>("");
const history = signal<string[]>([]);
const results = signal<ISearchResponse>({});
const searchConfig = signal<IGetSearchConfigResponse[]>([]);

export const SearchContext = createContext<SearchContextType | null>(null);

export const SearchProvider = ({
  children,
}: {
  children: ComponentChildren;
}) => {
  const searchQuery = useQuery$<ISearchResponse>(() => ({
    queryKey: ["search", currentTerm.value],
    queryFn: async () => {
      const promises: Promise<IGetSearchItem[]>[] = [];
      const mapIndex: string[] = [];

      searchConfig.value.forEach((config) => {
        mapIndex.push(config.id);
        promises.push(fetchSearchItem(config, currentTerm.value));
      });

      const results = await Promise.all(promises);
      const searchResults: ISearchResponse = {};

      results.forEach((result, index) => {
        searchResults[mapIndex[index]] = result;
      });

      return searchResults;
    },
    enabled: !!(currentTerm.value && currentTerm.value.length >= 3),
    initialData: results.value,
  }));

  effect(() => {
    const term = currentTerm.peek();
    const queryResult = searchQuery!.data;

    if (history.value[0] !== lastTerm.value) {
      lastTerm.value = history.value[0];
    }

    if (term && !history.value.includes(term)) {
      history.value = [term, ...history.value];
    }

    if (queryResult) {
      results.value = queryResult;
    }
  });

  return (
    <SearchContext.Provider
      value={{
        currentTerm,
        lastTerm,
        history,
        results,
        searchQuery,
        searchConfig
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
