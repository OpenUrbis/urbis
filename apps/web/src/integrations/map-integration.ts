import { IGetConfigResponse } from "../types/fetch-map-config-type";

const environment = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const getMapConfig = async (): Promise<IGetConfigResponse> => {
  const response = await fetch(`${environment}/map-config`);
  if (!response.ok) {
    throw new Error("Failed to fetch map config");
  }

  return await response.json();
};
