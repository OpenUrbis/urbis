import { apiClient } from './api-client';

export type LegisSearchCondition = {
  id: string;
  field: 'term' | 'normativeType' | 'actDate' | 'authorityId' | 'scope';
  operator: 'contains' | 'equals' | 'not_contains' | 'greater' | 'less';
  value: string;
  connector: 'AND' | 'OR';
};

export type LegisAdvancedSearchQuery = {
  conditions: LegisSearchCondition[];
};

export type LegisPageApiModel = {
  id: string;
  title: string;
  slug: string;
  type: string;
  author: string;
  tags: string[];
  categoryId?: string | null;
  isPublic: boolean;
  content: string;
  source?: {
    url: string;
    type: 'html' | 'pdf' | 'location';
  } | null;
  entityType?: string | null;
  entityData?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
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
  tags?: string[];
  categoryId?: string;
  isPublic?: boolean;
  source?: {
    url: string;
    type: 'html' | 'pdf' | 'location';
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
    page?: number;
    limit?: number;
  }) {
    return apiClient.get<PaginatedResponse<LegisPageApiModel>>('/legis/pages', {
      query: params,
      auth: 'optional',
    });
  },

  getById(id: string) {
    return apiClient.get<LegisPageApiModel>(`/legis/pages/${id}`, {
      auth: 'optional',
    });
  },

  create(payload: CreateLegisPagePayload) {
    return apiClient.post<LegisPageApiModel>('/legis/pages', payload, {
      auth: 'required',
    });
  },

  update(id: string, payload: UpdateLegisPagePayload) {
    return apiClient.patch<LegisPageApiModel>(`/legis/pages/${id}`, payload, {
      auth: 'required',
    });
  },

  remove(id: string) {
    return apiClient.delete<void>(`/legis/pages/${id}`, {
      auth: 'required',
    });
  },

  searchPages(query: LegisAdvancedSearchQuery) {
    return apiClient.post<GlobalSearchApiResult[]>('/legis/search/pages', query, {
      auth: 'optional',
    });
  },

  searchNormativeElements(query: string | LegisAdvancedSearchQuery) {
    const payload = typeof query === 'string' ? { query } : query;

    return apiClient.post<NormativeSearchApiResult[]>(
      '/legis/search/normative-elements',
      payload,
      { auth: 'optional' },
    );
  },

  importFromUrl(url: string) {
    return apiClient.post<{ content: string; metadata?: Record<string, unknown> }>(
      '/legis/import/url',
      { url },
      { auth: 'required' },
    );
  },
};