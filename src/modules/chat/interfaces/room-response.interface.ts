export interface RoomResponse {
  id: number;
  name: string;
  description?: string;
  theme: string;
  maxParticipants: number;
  participants: number;
  alcoholCategory?: number[];
  moodCategory?: number[];
}
