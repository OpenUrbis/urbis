import { computed } from "@preact/signals";
import { useContext } from "react";
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
    drawerOpen,
  } = context;
  const currentPage = computed(() => ctxCurrentPage.value);
  const lastPage = computed(() => ctxLastPage.value);
  const history = computed(() => ctxHistory.value);

  const isProspectiveSearchActive = computed(() => {
    return ctxCurrentPage.value?.key === "nav-prospective-search";
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigateTo = (page: any) => {
    ctxLastPage.value = ctxCurrentPage.value;
    ctxHistory.value.push(page);
    ctxCurrentPage.value = page;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigateReplace = (page: any) => {
    if (ctxHistory.value.length > 0) {
        ctxHistory.value.pop();
    }
    ctxHistory.value.push(page);
    ctxCurrentPage.value = page;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addOnPage = (page: any) => {
    navigateTo([currentPage.value, page]);
  };

  const toggleDrawer = () => {
    drawerOpen.value = !drawerOpen.value;
  };

  const navigatePop = () => {
  if (ctxHistory.value.length <= 1) {
    ctxCurrentPage.value = null;
    ctxLastPage.value = null;
    ctxHistory.value = [];
    return;
  }

  ctxHistory.value.pop();
  
  ctxCurrentPage.value = ctxHistory.value[ctxHistory.value.length - 1];

  ctxLastPage.value = ctxHistory.value.length > 1 
    ? ctxHistory.value[ctxHistory.value.length - 2] 
    : null;
};

  const rmOnPage = () => {
    if (!Array.isArray(ctxCurrentPage.value)) return;

    ctxCurrentPage.value = [...ctxCurrentPage.value].shift();
  };

  const clearCurrentPage = () => {
    ctxCurrentPage.value = null;
  };

  return {
    currentPage,
    lastPage,
    history,
    drawerOpen,
    isProspectiveSearchActive,
    navigateTo,
    navigateReplace,
    addOnPage,
    toggleDrawer,
    navigatePop,
    rmOnPage,
    clearCurrentPage,
  };
};
