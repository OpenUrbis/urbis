import { useSignal } from "@preact/signals";
import { getIntersections } from "../integrations/map-integration";
import { Polygon, ResponseData } from "../types/fetch-map-intersections-type";
import { useNavigationContext } from "./useNavigationContext";
import { useMediaQuery } from "./useMediaQuery";

export const useFetchIntersectingPolygons = () => {
  const data = useSignal<ResponseData | null>(null);

  const loading = useSignal<boolean>(false);
  const error = useSignal<string | null>(null);
  const {toggleDrawer} = useNavigationContext();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const reset = () => {
    loading.value = false;
    data.value = null;
    error.value = null;
  };

  const fetchData = async (polygon: Polygon) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await getIntersections(polygon);
      data.value = response;
      if (!isDesktop) toggleDrawer();
    } catch (err) {
      console.error(err);
      error.value = "Error fetching intersecting polygons";
    } finally {
      loading.value = false;
    }
  };

  return { data, loading, error, fetchData, reset };
};
