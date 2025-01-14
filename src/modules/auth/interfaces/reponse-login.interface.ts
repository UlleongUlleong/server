import { UserInfo } from './user-info.interface.ts';

export interface ResponseLogin {
  accessToken: string;
  userInfo: UserInfo;
}
