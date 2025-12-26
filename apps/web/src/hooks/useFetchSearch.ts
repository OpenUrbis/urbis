import { Signal } from "@preact/signals";
import { useState } from "react";
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
  const [data, setData] = useState<ISearchResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (term: string) => {
    setLoading(true);
    setError(null);

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

      setData(searchResults);
    } catch (err) {
      console.error(err);
      setError("Error fetching search results");
    } finally {
      setLoading(false);
    }
  };

  // Função para limpar os resultados
  const clearResults = () => {
    setData(null);
    setLoading(false);
    setError(null);
  };

  return { data, loading, error, fetchData, clearResults };
};
