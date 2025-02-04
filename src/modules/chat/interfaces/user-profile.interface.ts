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
