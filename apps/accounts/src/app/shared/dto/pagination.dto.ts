export interface IPagination {
  search?: string | null | undefined;
  page?: number;
  limit?: number;
}

export interface IPaginationWithExclude extends IPagination {
  exclude?: string[];
}

export interface IPaginationResponse<T> {
  data: T[];
  total: number;
}
