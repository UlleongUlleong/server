import { UserPayload } from '../../../common/interfaces/user-payload.interface';

export interface AuthenticateRequest extends Request {
  user: UserPayload;
}
