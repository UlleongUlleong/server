import {
  CursorPagination,
  OffsetPagination,
} from '../../../common/interfaces/pagination.interface';

export interface RoomInfo {
  id: number;
  name: string;
  description?: string;
  theme: string;
  maxParticipants: number;
  participants: number;
}

export interface RoomInfoByOffset {
  data: RoomInfo[];
  pagination: OffsetPagination;
}

export interface RoomInfoByCursor {
  data: RoomInfo[];
  pagination: CursorPagination;
}
