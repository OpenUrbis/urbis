import { Signal, useSignal } from "@preact/signals";
import { fetchSearchItem } from "../integrations/search-integration";
import {
  IGetSearchConfigResponse,
  IGetSearchItem,
  IGetSearchItemError,
  ISearchResponse,
} from "../types/fetch-search-config-type";

export const useFetchSearch = (
  searchConfig: Signal<IGetSearchConfigResponse[]>
) => {
  const data = useSignal<ISearchResponse | null>(null);
  const loading = useSignal<boolean>(false);
  const error = useSignal<string | null>(null);

  const fetchData = async (term: string) => {
    loading.value = true;
    error.value = null;

    try {
      const promises: Promise<IGetSearchItem[] | IGetSearchItemError[]>[] = [];
      const mapIndex: string[] = [];

      searchConfig.value.forEach((config) => {
        if (config.isActive !== false) {
          mapIndex.push(config.id);
          promises.push(fetchSearchItem(config, term));
        }
      });

      const results = await Promise.all(promises);
      const searchResults: ISearchResponse = {};

      results.forEach((result, index) => {
        searchResults[mapIndex[index]] = result;
      });

      data.value = searchResults;
    } catch (err) {
      console.error(err);
      error.value = "Error fetching search results";
    } finally {
      loading.value = false;
    }
  };

  // Função para limpar os resultados
  const clearResults = () => {
    data.value = null;
    loading.value = false;
    error.value = null;
  };

  return { data: data.value, loading: loading.value, error: error.value, fetchData, clearResults };
};
