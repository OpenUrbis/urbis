import { IGetConfigLayerSchema, IGetConfigLayerGroup } from "../types/fetch-map-config-type";

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

export const getLayerGroups = async (
  page?: number,
  pageSize?: number,
  search?: string
): Promise<IGetConfigLayerGroup[] | { data: IGetConfigLayerGroup[]; total: number }> => {
  const url = new URL(`${environment}/layer-groups`);
  if (page) url.searchParams.append("page", page.toString());
  if (pageSize) url.searchParams.append("pageSize", pageSize.toString());
  if (search) url.searchParams.append("search", search);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Failed to fetch layer groups");
  }

  return await response.json();
};

export const getLayerGroup = async (id: string): Promise<IGetConfigLayerGroup> => {
  const response = await fetch(`${environment}/layer-groups/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch layer group");
  }
  return await response.json();
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createLayerGroup = async (data: any): Promise<IGetConfigLayerGroup> => {
  const response = await fetch(`${environment}/layer-groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to create layer group");
  }
  return await response.json();
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const updateLayerGroup = async (id: string, data: any): Promise<IGetConfigLayerGroup> => {
  const response = await fetch(`${environment}/layer-groups/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to update layer group");
  }
  return await response.json();
};

export const getLayerSchemas = async (
  page?: number,
  pageSize?: number
): Promise<IGetConfigLayerSchema[] | { data: IGetConfigLayerSchema[]; total: number }> => {
  let url = `${environment}/layer-schemas`;
  if (page && pageSize) {
    url += `?page=${page}&pageSize=${pageSize}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch layer schemas");
  }

  return await response.json();
};
