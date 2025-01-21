import { Controller, Get, Query } from '@nestjs/common';
import { FindByCursorDto } from './dtos/find-by-cursor.dto';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';
import { RoomResponse } from './interfaces/room-response.interface';
import { ChatService } from './chat.service';
import { FindByOffsetDto } from './dtos/find-by-offset.dto';

@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('rooms/offset')
  async getChatRoomsByOffset(
    @Query() findRoomDto: FindByOffsetDto,
  ): Promise<ApiResponse<RoomResponse[]>> {
    const { data, meta } =
      await this.chatService.findRoomsByOffset(findRoomDto);

    return {
      status: 'success',
      data,
      meta,
      message: '채팅방을 정상적으로 조회했습니다.',
    };
  }

  @Get('rooms/cursor')
  async getChatRoomsByCursor(
    @Query() findRoomDto: FindByCursorDto,
  ): Promise<ApiResponse<RoomResponse[]>> {
    const { data, meta } =
      await this.chatService.findRoomsByCursor(findRoomDto);

    return {
      status: 'success',
      data,
      meta,
      message: '채팅방을 정상적으로 조회했습니다.',
    };
  }
}
