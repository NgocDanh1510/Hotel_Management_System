export interface PaginationMeta {
  total: number;
  offset?: number;
  limit?: number;
  page?: number;
  has_next: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  meta: PaginationMeta;
}

/** Success response envelope */
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  errors?: string[];
}
