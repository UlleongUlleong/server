export interface UserPayload {
  id: number;
  nickname: string;
  imageUrl: string;
  provider: string;
  iat?: number;
  exp?: number;
}
