import { apiClient } from "./api-client";
import type { UserSummaryPayload } from "../domain/user-summary";

export type LegisUserSummaryApiModel = UserSummaryPayload;

export type LegisSearchCondition = {
  id: string;
  field:
    | "term"
    | "normativeType"
    | "actDate"
    | "date"
    | "authorityId"
    | "authority"
    | "scope"
    | "number"
    | "pageId"
    | "id";
  operator: "contains" | "equals" | "not_contains" | "greater" | "less";
  value: string;
  connector: "AND" | "OR";
};

export type LegisAdvancedSearchQuery = {
  conditions: LegisSearchCondition[];
  withDeleted?: boolean;
};

export type LegisPageApiModel = {
  id: string;
  title: string;
  slug: string;
  type: string;
  /** Rótulo de exibição do autor (texto livre para conteúdo importado/legado). */
  author: string;
  /** Usuário do sistema creditado como autor. */
  authorId?: string | null;
  authorUser?: LegisUserSummaryApiModel | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdByUser?: LegisUserSummaryApiModel | null;
  updatedByUser?: LegisUserSummaryApiModel | null;
  tags: string[];
  categoryId?: string | null;
  isPublic: boolean;
  content: string;
  source?: {
    url: string;
    type: "html" | "pdf" | "location";
  } | null;
  entityType?: string | null;
  entityData?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export type GlobalSearchApiResult = {
  page: LegisPageApiModel;
  matches: {
    field: string;
    snippet: string;
    elementId?: string;
  }[];
  score: number;
};

export type NormativeSearchApiResult = {
  pageId: string;
  pageTitle: string;
  elementId: string;
  type: string;
  index?: string;
  text: string;
};

export type CreateLegisPagePayload = {
  title: string;
  content: string;
  type?: string;
  author?: string;
  authorId?: string;
  tags?: string[];
  categoryId?: string;
  isPublic?: boolean;
  source?: {
    url: string;
    type: "html" | "pdf" | "location";
  };
  entityType?: string;
  entityData?: Record<string, unknown>;
};

export type UpdateLegisPagePayload = Partial<CreateLegisPagePayload>;

export const legisPageApi = {
  list(params?: {
    ids?: string[];
    type?: string;
    categoryId?: string;
    isPublic?: boolean;
    search?: string;
    author?: string;
    authorId?: string;
    page?: number;
    limit?: number;
    withDeleted?: boolean;
  }) {
    return apiClient.get<PaginatedResponse<LegisPageApiModel>>("/legis/pages", {
      query: params,
      auth: "optional",
    });
  },

  getById(id: string) {
    return apiClient.get<LegisPageApiModel>(`/legis/pages/${id}`, {
      auth: "optional",
    });
  },

  create(payload: CreateLegisPagePayload) {
    return apiClient.post<LegisPageApiModel>("/legis/pages", payload, {
      auth: "required",
    });
  },

  update(id: string, payload: UpdateLegisPagePayload) {
    return apiClient.patch<LegisPageApiModel>(`/legis/pages/${id}`, payload, {
      auth: "required",
    });
  },

  remove(id: string) {
    return apiClient.delete<void>(`/legis/pages/${id}`, {
      auth: "required",
    });
  },

  restore(id: string) {
    return apiClient.post<LegisPageApiModel>(
      `/legis/pages/${id}/restore`,
      undefined,
      {
        auth: "required",
      },
    );
  },

  permanentDelete(id: string) {
    return apiClient.delete<void>(`/legis/pages/${id}/permanent`, {
      auth: "required",
    });
  },

  getByIdWithDeleted(id: string) {
    return apiClient.get<LegisPageApiModel>(`/legis/pages/${id}`, {
      query: { withDeleted: true },
      auth: "required",
    });
  },

  searchPages(query: LegisAdvancedSearchQuery) {
    return apiClient.post<GlobalSearchApiResult[]>(
      "/legis/search/pages",
      query,
      {
        auth: "optional",
      },
    );
  },

  searchNormativeElements(query: string | LegisAdvancedSearchQuery) {
    const payload = typeof query === "string" ? { query } : query;

    return apiClient.post<NormativeSearchApiResult[]>(
      "/legis/search/normative-elements",
      payload,
      { auth: "optional" },
    );
  },

  importFromUrl(url: string) {
    return apiClient.post<{
      content: string;
      metadata?: Record<string, unknown>;
    }>("/legis/import/url", { url }, { auth: "required" });
  },
};
