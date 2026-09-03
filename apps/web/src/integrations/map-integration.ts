import axios from "axios";
import { getOptionalAuthHeaders } from "../utils/auth-headers";
import { IGetConfigResponse } from "../types/fetch-map-config-type";
import { Polygon, ResponseData } from "../types/fetch-map-intersections-type";

const environment = (import.meta.env.VITE_API_URL || "/api") + "/maps";

export const getMapConfig = async (): Promise<IGetConfigResponse> => {
  const headers = await getOptionalAuthHeaders().catch(() => ({}));
  let response = await fetch(`${environment}/config/map`, { headers });
  if (!response.ok && Object.keys(headers).length > 0) {
    // If the request failed with auth headers (e.g. 401 Unauthorized due to expired or invalid token),
    // retry anonymously so public map data can still be loaded.
    response = await fetch(`${environment}/config/map`);
  }
  if (!response.ok) {
    throw new Error("Failed to fetch map config");
  }

  return await response.json();
};

const isPolygonGeometry = (value: unknown) => {
  if (!value || typeof value !== "object") return false;

  const geometry = value as { type?: unknown; coordinates?: unknown };

  return (
    (geometry.type === "Polygon" || geometry.type === "MultiPolygon") &&
    Array.isArray(geometry.coordinates) &&
    geometry.coordinates.length > 0
  );
};

const normalizeIntersectionPayload = (polygon: Polygon) => {
  if (!polygon || typeof polygon !== "object") {
    throw new Error("Geometria inválida para análise de interseções.");
  }

  if (polygon.type === "FeatureCollection") {
    const feature = polygon.features?.find((item) =>
      isPolygonGeometry(item?.geometry),
    );

    if (!feature) {
      throw new Error(
        "A coleção enviada não possui Polygon ou MultiPolygon válido.",
      );
    }

    return {
      type: "Feature" as const,
      geometry: feature.geometry,
      properties: feature.properties ?? {},
    };
  }

  if (polygon.type === "Feature") {
    if (!isPolygonGeometry(polygon.geometry)) {
      throw new Error(
        "A feição enviada não possui Polygon ou MultiPolygon válido.",
      );
    }

    return {
      type: "Feature" as const,
      geometry: polygon.geometry,
      properties: polygon.properties ?? {},
    };
  }

  if (isPolygonGeometry(polygon)) {
    return {
      type: "Feature" as const,
      geometry: polygon,
      properties: {},
    };
  }

  throw new Error("Formato de geometria não suportado para interseções.");
};

export const getIntersections = async (
  polygon: Polygon,
  activeLayers?: string[],
  options?: { isFiu?: boolean; context?: string },
): Promise<ResponseData> => {
  const payload = normalizeIntersectionPayload(polygon);
  const isFiu = Boolean(options?.isFiu || options?.context === "fiu");
  payload.properties = {
    ...(payload.properties || {}),
    ...(isFiu ? { isFiu: true, context: "fiu" } : {}),
    ...(activeLayers && Array.isArray(activeLayers) && activeLayers.length > 0
      ? { activeLayers }
      : {}),
  };
  const headers = await getOptionalAuthHeaders();
  const { data } = await axios.post(
    `${environment}/geospatial-intersections`,
    payload,
    { headers },
  );

  return data;
};

export const createGetTextLayerUri = (origin: string) => {
  return `${environment}/config/text-layer?origin=${origin}`;
};

export const exportGeoJson = async (
  bounds: number[],
  layers: string[],
  zoom?: number,
  format?: "geojson" | "dwg",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  externalLayers?: any[],
): Promise<Blob> => {
  const headers = await getOptionalAuthHeaders();
  const { data } = await axios.post(
    `${environment}/export/geojson`,
    {
      bounds,
      layers,
      zoom,
      format,
      externalLayers,
    },
    {
      headers,
      responseType: "blob",
    },
  );

  return data;
};
