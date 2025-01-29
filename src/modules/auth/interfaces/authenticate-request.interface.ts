import { SafeUser } from '../../../modules/user/interfaces/safe-user.interface';

export interface AuthenticateRequest extends Request {
  user: SafeUser;
  token?: string;
  cookies?: { [key: string]: string };
}
