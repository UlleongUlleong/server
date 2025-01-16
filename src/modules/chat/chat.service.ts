import {
  ForbiddenException,
  Inject,
  Injectable,
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
import { validate } from 'class-validator';

@Injectable()
export class ChatService {
  constructor(
    @Inject('REDIS_CLIENT') private redis: Redis,
    private prisma: PrismaService,
    private categoryService: CategoryService,
    private themeService: ThemeService,
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

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

  async validateDto(dto: object) {
    const errors = await validate(dto);
    console.log(errors);
    if (errors.length > 0) {
      throw new Error(errors.toString());
    }
    console.log('no problem');
  }

  async createConnection(clientId: string, userId: number): Promise<void> {
    const key = `chat:users:${clientId}`;
    await this.redis.set(key, userId);
  }

  async findUserByClientId(clientId: string): Promise<number> {
    const key = `chat:users:${clientId}`;
    const userId = await this.redis.get(key);
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
}
