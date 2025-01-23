import { Pagination } from './pagination.interface';

export interface CustomResponse<T> {
  data: T;
  message?: string;
  pagination?: Pagination;
}

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  pagination?: Pagination;
}
