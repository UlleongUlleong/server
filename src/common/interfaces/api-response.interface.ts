export interface ApiResponse<T> {
  status: string;
  data: T;
  meta?: object;
  message: string;
}
