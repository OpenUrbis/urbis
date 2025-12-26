import { useContext } from "preact/hooks";
import { SearchContext } from "../context/SearchContext";
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

      const currentConfig = context!.searchConfig.value;
      if (currentConfig && currentConfig.length > 0) {
        const mergedResponse = response.map((newItem) => {
          const existingItem = currentConfig.find((c) => c.id === newItem.id);
          if (existingItem && existingItem.isActive !== undefined) {
            return { ...newItem, isActive: existingItem.isActive };
          }
          return newItem;
        });
        context!.searchConfig.value = mergedResponse;
      } else {
        context!.searchConfig.value = response;
      }

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
