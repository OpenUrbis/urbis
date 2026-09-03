import { Signal, useSignal } from "@preact/signals";
import { useRef } from "react";
import { fetchSearchItem } from "../integrations/search-integration";
import {
  IGetSearchConfigResponse,
  IGetSearchItem,
  IGetSearchItemError,
  ISearchResponse,
} from "../types/fetch-search-config-type";

export const useFetchSearch = (
  searchConfig: Signal<IGetSearchConfigResponse[]>,
) => {
  const data = useSignal<ISearchResponse | null>(null);
  const loading = useSignal<boolean>(false);
  const error = useSignal<string | null>(null);
  const latestRequestId = useRef(0);

  const fetchData = async (
    term: string,
    initialResults: ISearchResponse = {},
  ) => {
    const requestId = latestRequestId.current + 1;
    latestRequestId.current = requestId;

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
      if (requestId !== latestRequestId.current) return;

      const searchResults: ISearchResponse = { ...initialResults };

      results.forEach((result, index) => {
        searchResults[mapIndex[index]] = result;
      });

      data.value = searchResults;
    } catch (err) {
      if (requestId !== latestRequestId.current) return;

      console.error(err);
      error.value = "Error fetching search results";
    } finally {
      if (requestId === latestRequestId.current) {
        loading.value = false;
      }
    }
  };

  // Função para limpar os resultados
  const clearResults = () => {
    latestRequestId.current += 1;
    data.value = null;
    loading.value = false;
    error.value = null;
  };

  const setResults = (results: ISearchResponse) => {
    latestRequestId.current += 1;
    data.value = results;
  };

  return {
    data: data.value,
    loading: loading.value,
    error: error.value,
    fetchData,
    clearResults,
    setResults,
  };
};
