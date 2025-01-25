export interface WsContent<T> {
  event: string;
  data: T;
  message?: string;
}

export interface WsResponse<T> {
  event: string;
  data: {
    data: T;
    message: string;
  };
}
