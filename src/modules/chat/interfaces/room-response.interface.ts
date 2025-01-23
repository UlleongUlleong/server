import {
  CursorPagination,
  OffsetPagination,
} from '../../../common/interfaces/pagination.interface';

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
  pagination: OffsetPagination;
}

export interface RoomResponseByCursor {
  data: RoomResponse[];
  pagination: CursorPagination;
}
