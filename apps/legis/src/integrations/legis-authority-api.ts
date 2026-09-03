import { apiClient } from "./api-client";
import type { UserSummaryPayload } from "../domain/user-summary";

export type LegisAuthorityApiModel = {
  id: string;
  complementFull?: string | null;
  complementAbbr?: string | null;
  commonRefFull: string;
  commonRefAbbr: string;
  startDate: string;
  endDate?: string | null;
  pageId?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdByUser?: UserSummaryPayload | null;
  updatedByUser?: UserSummaryPayload | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateLegisAuthorityApiPayload = {
  id?: string;
  complementFull?: string;
  complementAbbr?: string;
  commonRefFull: string;
  commonRefAbbr: string;
  startDate: string;
  endDate?: string;
  pageId?: string;
};

export const legisAuthorityApi = {
  list() {
    return apiClient.get<LegisAuthorityApiModel[]>("/legis/authorities", {
      auth: "optional",
    });
  },

  create(payload: CreateLegisAuthorityApiPayload) {
    return apiClient.post<LegisAuthorityApiModel>(
      "/legis/authorities",
      payload,
      {
        auth: "required",
      },
    );
  },

  update(id: string, payload: Partial<CreateLegisAuthorityApiPayload>) {
    return apiClient.patch<LegisAuthorityApiModel>(
      `/legis/authorities/${id}`,
      payload,
      {
        auth: "required",
      },
    );
  },

  remove(id: string) {
    return apiClient.delete<void>(`/legis/authorities/${id}`, {
      auth: "required",
    });
  },
};
