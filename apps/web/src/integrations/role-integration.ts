import { getAuthHeaders } from "../utils/auth-headers";

const environment = (import.meta.env.VITE_API_URL || "/api") + "/role";

export interface IRole {
  id: string;
  name: string;
  description?: string;
  status: string;
}

export const getRolesList = async (
  page = 1,
  limit = 100,
  search?: string,
): Promise<{ data: IRole[]; total: number } | IRole[] | any> => {
  const headers = await getAuthHeaders();
  const url = new URL(`${environment}/list`);
  url.searchParams.append("page", page.toString());
  url.searchParams.append("limit", limit.toString());
  if (search) url.searchParams.append("search", search);

  const response = await fetch(url.toString(), {
    headers,
  });

  if (!response.ok) {
    let message = "";
    try {
      const body = await response.json();
      message = typeof body?.message === "string" ? body.message : "";
    } catch {
      // Some responses do not contain JSON.
    }
    throw new Error(
      `Falha ao carregar os cargos (${response.status})${message ? `: ${message}` : ""}`,
    );
  }

  return await response.json();
};
