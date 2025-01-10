import { UserInfo } from "./userInfo.inerface";

export interface ResponseLogin {
  accessToken: string;
  userInfo: UserInfo;
}