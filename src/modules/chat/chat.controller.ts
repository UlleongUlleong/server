import { Controller, Get, Param, Query } from '@nestjs/common';
import { FindByCursorDto } from './dtos/find-by-cursor.dto';
import { HttpContent } from '../../common/interfaces/http-response.interface';
import { RoomResponse } from './interfaces/room-response.interface';
import { ChatService } from './chat.service';
import { FindByOffsetDto } from './dtos/find-by-offset.dto';
import { UserWithNickname } from './interfaces/user-with-nickname.interface';

@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('rooms/offset')
  async getChatRoomsByOffset(
    @Query() findRoomDto: FindByOffsetDto,
  ): Promise<HttpContent<RoomResponse[]>> {
    const { data, pagination } =
      await this.chatService.findRoomsByOffset(findRoomDto);

    return {
      data,
      pagination,
      message: '채팅방을 정상적으로 조회했습니다.',
    };
  }

  @Get('rooms/cursor')
  async getChatRoomsByCursor(
    @Query() findRoomDto: FindByCursorDto,
  ): Promise<HttpContent<RoomResponse[]>> {
    const { data, pagination } =
      await this.chatService.findRoomsByCursor(findRoomDto);

    return {
      data,
      pagination,
      message: '채팅방을 정상적으로 조회했습니다.',
    };
  }

  @Get('rooms/:id')
  async getChatRoomById(
    @Param('id') id: string,
  ): Promise<HttpContent<RoomResponse>> {
    const roomId = parseInt(id);
    const room = await this.chatService.findRoomById(roomId);

    return {
      data: room,
      message: '채팅방을 정상적으로 조회했습니다.',
    };
  }

  @Get('rooms/:id/participants')
  async getChatParticipants(
    @Param('id') id: string,
  ): Promise<HttpContent<UserWithNickname[]>> {
    const roomId = parseInt(id);
    const participants = await this.chatService.findParticipants(roomId);

    return {
      data: participants,
      message: '채팅방 참가자를 성공적으로 조회했습니다.',
    };
  }
}
