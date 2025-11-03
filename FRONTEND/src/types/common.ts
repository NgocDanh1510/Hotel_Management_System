export interface PaginationMeta {
  total: number;
  offset?: number;
  limit?: number;
  page?: number;
  has_next: boolean;
}

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  meta?: PaginationMeta;
}
