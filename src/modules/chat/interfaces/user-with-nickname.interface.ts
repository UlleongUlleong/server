export interface responseJoinRoom {
  participant: UserWithNickname;
  token: string;
}

export interface UserWithNickname {
  id: number;
  nickname: string;
}
