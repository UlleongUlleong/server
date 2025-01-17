import {
  ForbiddenException,
  Inject,
  Injectable,
  OnApplicationShutdown,
  UnauthorizedException,
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
export class ChatService implements OnApplicationShutdown {
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

  async deleteChatRoom(roomId: number): Promise<void> {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return;
    }

    await this.prisma.chatRoom.delete({
      where: { id: room.id },
    });
  }

  async deleteParticipant(userId: number): Promise<number> {
    const participant = await this.prisma.chatParticipant.findUnique({
      where: { userId },
    });

    if (!participant) {
      return 0;
    }

    const roomId = participant.roomId;
    await this.prisma.$transaction(async (tx) => {
      await tx.chatParticipant.delete({
        where: { userId },
      });

      let newHost;
      if (participant.isHost) {
        newHost = await tx.chatParticipant.findFirst({
          where: { roomId },
          orderBy: { joinedAt: 'asc' },
        });

        if (!newHost) {
          return this.deleteChatRoom(participant.roomId);
        }

        await tx.chatParticipant.update({
          where: { userId: newHost.userId },
          data: { isHost: true },
        });
      }
    });

    return roomId;
  }
}
