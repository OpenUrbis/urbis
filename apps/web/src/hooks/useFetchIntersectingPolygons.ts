import { useSignal } from "@preact/signals";
import axios from "axios";
import { getIntersections } from "../integrations/map-integration";
import { Polygon, ResponseData } from "../types/fetch-map-intersections-type";

export const useFetchIntersectingPolygons = () => {
  const data = useSignal<ResponseData | null>(null);
  const loading = useSignal<boolean>(false);
  const error = useSignal<string | null>(null);

  const reset = () => {
    loading.value = false;
    data.value = null;
    error.value = null;
  };

  const fetchData = async (
    polygon: Polygon,
    activeLayers?: string[],
    options?: { isFiu?: boolean; context?: string },
  ) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await getIntersections(polygon, activeLayers, options);
      data.value = response;
    } catch (err) {
      console.error(err);
      const apiMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || err.response?.data?.error
        : undefined;
      error.value =
        apiMessage ||
        (err instanceof Error
          ? err.message
          : "Erro ao buscar interseções do polígono.");
    } finally {
      loading.value = false;
    }
  };

  return {
    data: data.value,
    loading: loading.value,
    error: error.value,
    fetchData,
    reset,
  };
};
