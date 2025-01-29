export interface SafeUser {
  id: number;
  providerId: number;
  isActive: boolean;
  deletedAt: Date;
}
