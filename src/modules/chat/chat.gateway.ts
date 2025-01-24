import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CreateRoomDto } from './dtos/create-room.dto';
import { ChatService } from './chat.service';
import { UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { JoinRoomDto } from './dtos/join-room.dto';
import { WSExceptionFilter } from 'src/common/filters/ws-exception.filter';

@WebSocketGateway({ namespace: 'chat' })
@UseFilters(WSExceptionFilter)
export class ChatGateway {
  constructor(private chatService: ChatService) {}

  @WebSocketServer() server: Server;

  async handleConnection(client: Socket) {
    try {
      const header = client.handshake.headers.authorization;
      const token = header?.replace('Bearer ', '');
      const payload = await this.chatService.validateToken(token);

      const clientId = client.id;
      const userId = payload.sub;
      await this.chatService.createConnection(clientId, userId);
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const clientId = client.id;

    await this.handleLeaveRoom(client);
    await this.chatService.deleteConnection(clientId);
  }

  @SubscribeMessage('create_room')
  @UsePipes(new ValidationPipe())
  async handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() createRoomDto: CreateRoomDto,
  ) {
    const userId = await this.chatService.findUserByClientId(client.id);
    const room = await this.chatService.createChatRoom(userId, createRoomDto);

    client.join(room.toString());

    return {
      event: 'room_created',
      data: {
        message: '채팅방이 생성되었습니다.',
      },
    };
  }

  @SubscribeMessage('join_room')
  @UsePipes(new ValidationPipe())
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() joinRoomDto: JoinRoomDto,
  ) {
    const clientId = client.id;
    const roomId = joinRoomDto.roomId;
    const userId = await this.chatService.findUserByClientId(clientId);
    await this.chatService.createParticipant(userId, roomId);

    client.join(roomId.toString());
    this.server.to(roomId.toString()).emit('user_joined', { userId });

    return {
      event: 'room_joined',
      data: {
        message: '채팅방에 참가하였습니다.',
      },
    };
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(@ConnectedSocket() client: Socket) {
    const clientId = client.id;
    const userId = await this.chatService.findUserByClientId(clientId);
    const roomId = await this.chatService.deleteParticipant(userId);

    if (roomId) {
      client.leave(roomId.toString());
      this.server.to(roomId.toString()).emit('user_left', { userId });
    }

    return {
      event: 'room_left',
      data: {
        message: '채팅방을 떠났습니다.',
      },
    };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: string,
  ) {
    const userId = await this.chatService.findUserByClientId(client.id);
    const roomId = await this.chatService.getRoomIdByUserId(userId);
    if (!roomId) {
      return {
        event: 'error',
        data: { error: '사용자가 속한 채팅방을 찾을 수 없습니다.' },
      };
    }
    await this.chatService.saveMessageToRedis(roomId, userId, message);

    this.server.to(roomId.toString()).emit('new_message', {
      userId,
      message,
      timestamp: new Date().toString(),
    });

    return {
      event: 'message_send',
      data: { message: '메시지가 전송' },
    };
  }
}
