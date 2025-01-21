type offsetMeta = {
  total: number;
  pageSize: number;
  page: number;
  totalPages: number;
};

type cursorMeta = {
  hasNext: boolean;
  nextCursor: number;
};

export interface RoomResponse {
  id: number;
  name: string;
  description?: string;
  theme: string;
  maxParticipants: number;
  participants: number;
}

export interface RoomResponseByOffset {
  data: RoomResponse[];
  meta: offsetMeta;
}

export interface RoomResponseByCursor {
  data: RoomResponse[];
  meta: cursorMeta;
}
