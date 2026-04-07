import { IGetConfigLayerSchema } from "../types/fetch-map-config-type";

const environment =
  (import.meta.env.VITE_API_URL || "https://api.mapa.urbis.sampa.br") + "/maps";

export const getLayerSchema = async (
  id: string
): Promise<IGetConfigLayerSchema> => {
  const response = await fetch(`${environment}/layer-schemas/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch layer schema");
  }

  return await response.json();
};
