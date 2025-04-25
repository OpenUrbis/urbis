import { useContext } from "preact/hooks";
import { SearchContext } from "../context/SearchContext-test";
import { getSearchConfig } from "../integrations/search-integration";
import { IGetSearchConfigResponse } from "../types/fetch-search-config-type";

export const useSearchContext = () => {
  const context = useContext(SearchContext);

  const resetSearch = (): void => {
    if (!context?.currentTerm) {
      return console.error("Current term is not defined in context");
    }

    context.currentTerm.value = "";
  };

  const populateSearchConfig = async (): Promise<
    IGetSearchConfigResponse[] | null
  > => {
    if (!context?.searchConfig) {
      console.error("Search config is not defined in context");
      return null;
    }

    try {
      const response = await getSearchConfig();
      context!.searchConfig.value = response;

      return response;
    } catch (error) {
      console.error("Error fetching search config:", error);
      return null;
    }
  };

  if (!context)
    throw new Error("useSearchContext must be used within a SearchProvider");

  return { ...context, resetSearch, populateSearchConfig };
};
