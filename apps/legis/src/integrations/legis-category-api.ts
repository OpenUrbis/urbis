import { apiClient } from "./api-client";

export type LegisCategoryApiModel = {
  id: string;
  name: string;
  color?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export const legisCategoryApi = {
  list() {
    return apiClient.get<LegisCategoryApiModel[]>("/legis/categories", {
      auth: "optional",
    });
  },

  create(payload: { name: string; color?: string }) {
    return apiClient.post<LegisCategoryApiModel>("/legis/categories", payload, {
      auth: "required",
    });
  },
};
