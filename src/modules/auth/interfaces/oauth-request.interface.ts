import { UserPayload } from './user-payload.interface';

export interface OAuthRequest extends Request {
  user: UserPayload;
}
