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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createLayerSchema = async (data: any): Promise<IGetConfigLayerSchema> => {
  const response = await fetch(`${environment}/layer-schemas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to create layer schema");
  }
  return await response.json();
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const updateLayerSchema = async (id: string, data: any): Promise<IGetConfigLayerSchema> => {
  const response = await fetch(`${environment}/layer-schemas/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to update layer schema");
  }
  return await response.json();
};

export const deleteLayerSchema = async (id: string): Promise<void> => {
  const response = await fetch(`${environment}/layer-schemas/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete layer schema");
  }
};

export const getLayerSchemas = async (
  page?: number,
  pageSize?: number,
  search?: string
): Promise<IGetConfigLayerSchema[] | { data: IGetConfigLayerSchema[]; total: number }> => {
  const url = new URL(`${environment}/layer-schemas`);
  if (page) url.searchParams.append("page", page.toString());
  if (pageSize) url.searchParams.append("pageSize", pageSize.toString());
  if (search) url.searchParams.append("search", search);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Failed to fetch layer schemas");
  }

  return await response.json();
};
