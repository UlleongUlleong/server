import { User } from '@prisma/client';

export interface AuthenticateRequest extends Request {
  user: User;
  token?: string;
  cookies?: { [key: string]: string };
}
