import axios from "axios";
import { IGetConfigResponse } from "../types/fetch-map-config-type";
import { Polygon, ResponseData } from "../types/fetch-map-intersections-type";

const environment =
  (import.meta.env.VITE_API_URL || "https://api.mapa.urbis.sampa.br") + "/maps";

export const getMapConfig = async (): Promise<IGetConfigResponse> => {
  const response = await fetch(`${environment}/config/map`);
  if (!response.ok) {
    throw new Error("Failed to fetch map config");
  }

  return await response.json();
};

export const getIntersections = async (
  polygon: Polygon
): Promise<ResponseData> => {
  const { data } = await axios.post(
    `${environment}/geospatial-intersections`,
    polygon
  );

  return data;
};

export const createGetTextLayerUri = (origin: string) => {
  return `${environment}/config/text-layer?origin=${origin}`;
};
