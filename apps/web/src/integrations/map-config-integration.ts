import { getAuthHeaders } from "@/utils/auth-headers";
import {
  IMapConfigAdminItem,
  IUpdateMapConfigPayload,
} from "@/types/map-config-admin-type";

const environment =
  (import.meta.env.VITE_API_URL || "/api") + "/maps/config";

export const getAdminMapConfigs = async (): Promise<IMapConfigAdminItem[]> => {
  const response = await fetch(environment);

  if (!response.ok) {
    throw new Error("Failed to fetch map configs");
  }

  return await response.json();
};

export const updateAdminMapConfig = async (
  id: string,
  payload: IUpdateMapConfigPayload,
): Promise<IMapConfigAdminItem> => {
  const response = await fetch(`${environment}/${id}`, {
    method: "PATCH",
    headers: await getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = "Falha ao atualizar parâmetro do mapa";

    try {
      const error = await response.json();
      message = error?.message ?? message;
    } catch {
      // noop
    }

    throw new Error(Array.isArray(message) ? message.join(", ") : message);
  }

  return await response.json();
};