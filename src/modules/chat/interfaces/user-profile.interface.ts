export interface UserProfile {
  userId: number;
  nickname: string;
}

export interface RoomEntryInfo extends UserProfile {
  themeId: number;
  roomName: string;
}

export interface UserRoomInfo extends UserProfile {
  roomId: number;
}

export interface ResponseCreateRoom extends UserRoomInfo {
  sessionId: string;
  token: string;
}

export interface ResponseJoinRoom extends RoomEntryInfo {
  token: string;
}
