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
import {
  Logger,
  UseFilters,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JoinRoomDto } from './dtos/join-room.dto';
import { WsExceptionFilter } from 'src/common/filters/ws-exception.filter';
import { WsResponseInterceptor } from 'src/common/interceptors/ws-response.interceptor';
import { LoggingInterceptor } from 'src/common/interceptors/logging.interceptor';
import { WsContent } from 'src/common/interfaces/ws-response.interface';
import { SendMessageDto } from './dtos/send-message.dto';

@WebSocketGateway({ namespace: 'chat' })
@UseFilters(WsExceptionFilter)
@UseInterceptors(WsResponseInterceptor, LoggingInterceptor)
export class ChatGateway {
  private readonly logger = new Logger(ChatGateway.name);

  constructor(private chatService: ChatService) {}

  @WebSocketServer() server: Server;

  async handleConnection(client: Socket) {
    try {
      const cookieHeader = client.handshake.headers.cookie;
      const token = this.chatService.getAccessTokenFromCookie(cookieHeader);
      const user = await this.chatService.validateToken(token);

      const clientId = client.id;
      const userId = user.id;
      await this.chatService.createConnection(clientId, userId);
      this.logger.log(
        `Socket client(${clientId}) has connected to the server.`,
      );
    } catch (error) {
      this.logger.error(`${client.id} - ${error.stack}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const clientId = client.id;

    await this.handleLeaveRoom(client);
    await this.chatService.deleteConnection(clientId);
    this.logger.log(
      `Socket client(${clientId}) has disconnected from the server.`,
    );
  }

  @SubscribeMessage('create_room')
  @UsePipes(new ValidationPipe())
  async handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() createRoomDto: CreateRoomDto,
  ): Promise<WsContent<null>> {
    const userId = await this.chatService.findUserByClientId(client.id);
    const room = await this.chatService.createChatRoom(userId, createRoomDto);

    client.join(room.toString());

    return {
      event: 'room_created',
      data: null,
    };
  }

  @SubscribeMessage('join_room')
  @UsePipes(new ValidationPipe())
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() joinRoomDto: JoinRoomDto,
  ): Promise<WsContent<null>> {
    const clientId = client.id;
    const roomId = joinRoomDto.roomId;
    const userId = await this.chatService.findUserByClientId(clientId);
    await this.chatService.createParticipant(userId, roomId);
    const participant = await this.chatService.findParticipantById(userId);

    client.join(roomId.toString());
    this.server.to(roomId.toString()).emit('user_joined', {
      data: participant,
      message: `${participant.nickname}님이 채팅방에 입장하였습니다.`,
    });

    return {
      event: 'room_joined',
      data: null,
    };
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
  ): Promise<WsContent<null>> {
    const clientId = client.id;
    const userId = await this.chatService.findUserByClientId(clientId);
    const roomId = await this.chatService.deleteParticipant(userId);
    await this.chatService.createParticipant(userId, roomId);
    const participant = await this.chatService.findParticipantById(userId);

    if (roomId) {
      client.leave(roomId.toString());
      this.server.to(roomId.toString()).emit('user_left', {
        data: participant,
        message: `${participant.nickname}님이 채팅방을 퇴장했습니다.`,
      });
    }

    return {
      event: 'room_left',
      data: null,
    };
  }

  @SubscribeMessage('send_message')
  @UsePipes(new ValidationPipe())
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() sendMessageDto: SendMessageDto,
  ): Promise<WsContent<null>> {
    const userId = await this.chatService.findUserByClientId(client.id);
    const roomId = await this.chatService.getRoomIdByUserId(userId);
    if (!roomId) {
      return {
        event: 'error',
        data: null,
      };
    }
    const message = await this.chatService.saveMessageToRedis(
      roomId,
      userId,
      sendMessageDto,
    );

    this.server
      .to(roomId.toString())
      .emit('new_message', { data: message, message: '메시지 알림' });

    return {
      event: 'message_sent',
      data: null,
    };
  }
}
