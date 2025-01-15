export interface UserPayload {
  id: number;
  nickname: string;
  imageUrl: string;
  provider: string;
  isActive: boolean;
  iat?: number;
  exp?: number;
}
