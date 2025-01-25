import { Pagination } from './pagination.interface';

export interface HttpContent<T> {
  data: T;
  message?: string;
  pagination?: Pagination;
}

export interface HttpResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  path: string;
  pagination?: Pagination;
}
