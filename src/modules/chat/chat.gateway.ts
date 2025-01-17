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
import { UsePipes, ValidationPipe } from '@nestjs/common';

@WebSocketGateway({ namespace: 'chat' })
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
      client.emit('error', { message: '웹소켓 연결에 실패했습니다.' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`${client.id} is diconnected.`);
  }

  @SubscribeMessage('create_room')
  @UsePipes(new ValidationPipe())
  async handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() createRoomDto: CreateRoomDto,
  ) {
    try {
      const userId = await this.chatService.findUserByClientId(client.id);
      const room = await this.chatService.createChatRoom(userId, createRoomDto);

      client.join(room.toString());

      return {
        event: 'room_created',
        data: {
          message: '채팅방이 생성되었습니다.',
        },
      };
    } catch (error) {
      console.log(error);
      client.emit('error', { message: '채팅방 생성에 실패했습니다.' });
    }
  }
}
