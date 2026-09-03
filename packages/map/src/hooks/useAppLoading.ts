import { computed, signal } from "@preact/signals";
import { isMapPopulated, isRestored, isMapError } from "./useLayerPersistence";
import { useSearchContext } from "./useSearchContext";

export interface LoadingError {
  code: string;
  message: string;
  isFatal: boolean;
}

export const appError = signal<LoadingError | null>(null);

export const useAppLoading = () => {
  const { isSearchConfigLoaded, searchConfigError } = useSearchContext();

  const loadingState = computed(() => {
    // Check for errors first
    if (isMapError.value) {
      appError.value = {
        code: "M001001DS",
        message: "Erro ao carregar configurações do mapa",
        isFatal: true,
      };
      return { isLoading: false, text: "" };
    }

    if (searchConfigError.value) {
      // Search config error is not fatal, we just log it and proceed
      console.warn(
        `[S001001WR] Erro ao carregar configurações de busca: ${searchConfigError.value}`,
      );
    }

    if (!isMapPopulated.value) {
      return { isLoading: true, text: "Carregando informações do mapa..." };
    }

    if (!isSearchConfigLoaded.value) {
      return { isLoading: true, text: "Carregando configurações..." };
    }

    if (!isRestored.value) {
      return { isLoading: true, text: "Restaurando sessão..." };
    }

    return { isLoading: false, text: "" };
  });

  const isAppReady = computed(
    () => !loadingState.value.isLoading && !appError.value?.isFatal,
  );

  return {
    loadingState,
    isAppReady,
    appError,
  };
};
