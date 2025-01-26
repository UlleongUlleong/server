import { User } from '@prisma/client';

export interface AuthenticateRequest extends Request {
  user: User;
}
