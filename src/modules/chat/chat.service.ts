import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  OnApplicationShutdown,
  UnauthorizedException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from 'src/common/modules/prisma/prisma.service';
import { CreateRoomDto } from './dtos/create-room.dto';
import { CategoryService } from '../category/category.service';
import { Prisma } from '@prisma/client';
import { ThemeService } from './theme.service';
import { UserPayload } from 'src/common/interfaces/user-payload.interface';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
import { UserService } from '../user/user.service';

@Injectable()
export class ChatService implements OnModuleInit, OnApplicationShutdown {
  constructor(
    @Inject('REDIS_CLIENT') private redis: Redis,
    private prisma: PrismaService,
    private categoryService: CategoryService,
    private themeService: ThemeService,
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async onApplicationShutdown(signal?: string) {
    console.log(`애플리케이션이 종료되었습니다.: ${signal}`);
    await this.deleteAllConnections();
  }

  async validateToken(token: string): Promise<UserPayload> {
    const payload: UserPayload = await this.jwtService.verify(token);
    const user = await this.userService.findUserById(payload.sub);
    if (!user || user.deletedAt !== null) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    if (!user.isActive) {
      throw new ForbiddenException('비활성화된 사용자는 이용할 수 없습니다.');
    }

    return payload;
  }

  async createConnection(clientId: string, userId: number): Promise<void> {
    const key = 'chat:users';
    await this.redis.hset(key, clientId, userId);
  }

  async deleteConnection(clientId: string): Promise<void> {
    const key = 'chat:users';
    await this.redis.hdel(key, clientId);
  }

  async deleteAllConnections(): Promise<void> {
    const key = 'chat:users';
    await this.redis.del(key);
  }

  async findUserByClientId(clientId: string): Promise<number> {
    const key = 'chat:users';
    const userId = await this.redis.hget(key, clientId);
    if (!userId) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    return Number(userId);
  }

  async createChatRoom(userId: number, data: CreateRoomDto): Promise<number> {
    const { alcoholCategory = [], moodCategory = [], themeId } = data;
    await this.categoryService.checkAlocoholIdsExist(alcoholCategory);
    await this.categoryService.checkMoodIdsExist(moodCategory);
    await this.themeService.checkThemeIdExist(themeId);
    await this.checkParticipantDuplication(userId);

    const { name, description, maxParticipants } = data;
    const newRoom: Prisma.ChatRoomCreateInput = {
      name,
      description,
      maxParticipants,
      theme: {
        connect: { id: themeId },
      },
      participants: {
        create: {
          userId,
          isHost: true,
        },
      },
      alcoholCategory: {
        create: alcoholCategory.map((id) => ({
          alcoholCategory: { connect: { id } },
        })),
      },
      moodCategory: {
        create: moodCategory.map((id) => ({
          moodCategory: { connect: { id } },
        })),
      },
    };

    const room = await this.prisma.chatRoom.create({
      data: newRoom,
    });

    return room.id;
  }

  async createParticipant(userId: number, roomId: number): Promise<void> {
    await this.checkParticipantDuplication(userId);
    await this.checkRoomIdExists(roomId);

    const newParticipant: Prisma.ChatParticipantCreateInput = {
      user: {
        connect: { id: userId },
      },
      chatRoom: {
        connect: { id: roomId },
      },
    };

    await this.prisma.chatParticipant.create({
      data: newParticipant,
    });
  }

  async deleteParticipant(userId: number): Promise<number> {
    const participant = await this.prisma.chatParticipant.findUnique({
      where: { userId },
    });

    if (!participant) {
      throw new NotFoundException('참가한 채팅방이 없습니다.');
    }

    const roomId = participant.roomId;
    let hostCandidate;
    if (participant.isHost) {
      hostCandidate = await this.prisma.chatParticipant.findFirst({
        where: { roomId, userId: { not: userId } },
        orderBy: { joinedAt: 'asc' },
        select: { userId: true },
      });
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.chatParticipant.delete({
        where: { userId },
      });

      if (hostCandidate) {
        await tx.chatParticipant.update({
          where: { userId: hostCandidate.userId },
          data: { isHost: true },
        });
      } else {
        await tx.chatRoom.update({
          where: { id: roomId },
          data: { deletedAt: new Date() },
        });
      }
    });

    return roomId;
  }

  async checkParticipantDuplication(userId: number): Promise<void> {
    const participant = await this.prisma.chatParticipant.findUnique({
      where: { userId },
    });

    if (participant) {
      throw new ConflictException('이미 참가한 채팅방이 존재합니다.');
    }
  }

  async checkRoomIdExists(roomId: number): Promise<void> {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId, deletedAt: null },
    });

    if (!room) {
      throw new NotFoundException('채팅방이 존재하지 않습니다.');
    }
  }
  //
  async onModuleInit() {
    console.log('배치작업업');
    await this.startBatchSaveForAllRooms();
  }
  async saveMessageToRedis(
    roomId: number,
    userId: number,
    message: string,
  ): Promise<void> {
    const key = `chat:room:${roomId}:messages`;

    const messageData = {
      userId,
      message,
      timestamp: new Date().toISOString(),
    };
    await this.redis.lpush(key, JSON.stringify(messageData));
    console.log(await this.redis.lrange(key, 0, -1));
  }
  async getRoomIdByUserId(userId: number): Promise<number | null> {
    const participant = await this.prisma.chatParticipant.findUnique({
      where: { userId },
      select: { roomId: true },
    });

    return participant?.roomId || null;
  }
  async getMessagesFromRedis(roomId: number): Promise<any[]> {
    const key = `chat:room:${roomId}:messages`;
    const messages = await this.redis.lrange(key, 0, -1);
    return messages.map((message) => JSON.parse(message));
  }

  async batchSaveMessagesToDB(
    roomId: number,
    batchSize: number = 100,
  ): Promise<void> {
    const key = `chat:room:${roomId}:messages`;
    const messages = await this.redis.lrange(key, 0, batchSize - 1);

    if (messages.length === 0) return;

    const parseMessages = messages.map((message) => JSON.parse(message));
    const chatMessages = parseMessages.map((message) => ({
      userId: message.userId,
      roomId: roomId,
      message: message.message,
      loggedAt: message.timestamp,
    }));

    await this.prisma.chatLog.createMany({
      data: chatMessages,
    });
    await this.redis.ltrim(key, messages.length, -1);
  }

  async startBatchSave(roomId: number, interval: number = 5000): Promise<void> {
    const runBatchSave = async () => {
      try {
        await this.batchSaveMessagesToDB(roomId);
        console.log(`저장`);
      } catch (error) {
        console.error(`저장실패`, error);
      }
      setTimeout(runBatchSave, interval);
    };
    runBatchSave();
  }

  async startBatchSaveForAllRooms(interval: number = 5000): Promise<void> {
    const roomIds = await this.getAllRoomIds();

    roomIds.forEach((roomId) => {
      this.startBatchSave(roomId, interval);
    });
  }
  async getAllRoomIds(): Promise<number[]> {
    const participants = await this.prisma.chatParticipant.findMany({
      select: { roomId: true },
    });
    const roomIds = [
      ...new Set(participants.map((participant) => participant.roomId)),
    ];
    return roomIds;
  }
}
