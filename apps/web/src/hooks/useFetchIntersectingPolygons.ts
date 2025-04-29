import { useState } from "react";
import { getIntersections } from "../integrations/map-integration";
import { Polygon, ResponseData } from "../types/fetch-map-intersections-type";

export const useFetchIntersectingPolygons = () => {
  const [data, setData] = useState<ResponseData | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fetchData = async (polygon: Polygon) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getIntersections(polygon);
      setData(response);
    } catch (err) {
      console.error(err);
      setError("Error fetching intersecting polygons");
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fetchData };
};
