import { IsInt, IsNotEmpty } from 'class-validator';

export class JoinRoomDto {
  @IsNotEmpty({ message: '채팅방 ID는 필수 항목입니다.' })
  @IsInt({ message: '채팅방 ID는 정수입니다.' })
  roomId: number;
}
