export interface UserInfo {
  readonly id: number;
  readonly email: string;
  readonly nickname: string;
  readonly imageUrl?: string;
  readonly refreshToken: string;
}