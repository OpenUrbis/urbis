import { computed } from "@preact/signals";
import { useContext } from "preact/hooks";
import { NavigationContext } from "../context/NavigationContext";
import { INavigationContextActions } from "../types/navigation-context-type";

export const useNavigationContext = (): INavigationContextActions => {
  const context = useContext(NavigationContext);
  if (!context)
    throw new Error(
      "useNavigationContext must be used within a NavigationProvider"
    );

  const {
    currentPage: ctxCurrentPage,
    lastPage: ctxLastPage,
    history: ctxHistory,
  } = context;
  const currentPage = computed(() => ctxCurrentPage.value);
  const lastPage = computed(() => ctxLastPage.value);
  const history = computed(() => ctxHistory.value);

  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigateTo = (page: any) => {
    ctxLastPage.value = ctxCurrentPage.value;
    ctxHistory.value.push(page);
    ctxCurrentPage.value = page;
  };

  const clearCurrentPage = () => {
    ctxCurrentPage.value = null;
  };

  return { currentPage, lastPage, history, navigateTo, clearCurrentPage };
};
