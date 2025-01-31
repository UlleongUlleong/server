import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  OnApplicationShutdown,
  UnauthorizedException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/modules/prisma/prisma.service';
import { CreateRoomDto } from './dtos/create-room.dto';
import { CategoryService } from '../category/category.service';
import { Prisma } from '@prisma/client';
import { ThemeService } from './theme.service';
import { UserPayload } from '../../common/interfaces/user-payload.interface';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
import { UserService } from '../user/user.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FindByCursorDto } from './dtos/find-by-cursor.dto';
import {
  RoomResponse,
  RoomResponseByCursor,
  RoomResponseByOffset,
} from './interfaces/room-response.interface';
import { FindByOffsetDto } from './dtos/find-by-offset.dto';
import {
  CursorPagination,
  OffsetPagination,
} from '../../common/interfaces/pagination.interface';
import { UserWithNickname } from './interfaces/user-with-nickname.interface';
import { NewMessage } from './interfaces/new-message.interface';
import { SendMessageDto } from './dtos/send-message.dto';
import { SafeUser } from '../user/interfaces/safe-user.interface';

@Injectable()
export class ChatService implements OnApplicationShutdown {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @Inject('REDIS_CLIENT') private redis: Redis,
    private prisma: PrismaService,
    private categoryService: CategoryService,
    private themeService: ThemeService,
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleBatchSave() {
    await this.batchSaveMessagesToDB();
  }
  async onApplicationShutdown(signal?: string) {
    this.logger.log(
      `All connected chat client information has been deleted from Redis.: ${signal}`,
    );
  }

  async validateToken(token: string): Promise<SafeUser> {
    const payload: UserPayload = await this.jwtService.verify(token);
    const user = await this.userService.findUserById(payload.sub);
    if (user.deletedAt !== null) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    if (!user.isActive) {
      throw new ForbiddenException('비활성화된 사용자는 이용할 수 없습니다.');
    }

    const safeUser: SafeUser = {
      id: user.id,
      providerId: user.providerId,
      isActive: user.isActive,
      deletedAt: user.deletedAt,
    };

    return safeUser;
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

  async saveMessageToRedis(
    roomId: number,
    userId: number,
    sendMessageDto: SendMessageDto,
  ): Promise<NewMessage> {
    const key = `chat:messages`;

    const newMessage = {
      userId,
      roomId,
      message: sendMessageDto.message,
      createdAt: new Date().toISOString(),
    };
    await this.redis.lpush(key, JSON.stringify(newMessage));
    const participant = await this.findParticipantById(userId);
    delete newMessage.roomId;

    return {
      ...newMessage,
      nickname: participant.nickname,
    };
  }

  async getRoomIdByUserId(userId: number): Promise<number | null> {
    const participant = await this.prisma.chatParticipant.findUnique({
      where: { userId },
      select: { roomId: true },
    });

    return participant?.roomId || null;
  }

  async batchSaveMessagesToDB(batchSize: number = 100): Promise<void> {
    this.logger.log('Batch insert chat messages into the database');

    const key = `chat:messages`;
    const messages = [];
    for (let i = 0; i < batchSize; i++) {
      const message = await this.redis.lpop(key);
      if (!message) break;
      const parsedMessage = JSON.parse(message);
      messages.push(parsedMessage);
    }

    if (messages.length === 0) return;
    const chatMessages = messages.map((message) => ({
      userId: message.userId,
      roomId: message.roomId,
      message: message.message,
      loggedAt: new Date(message.createdAt),
    }));

    await this.prisma.chatLog.createMany({
      data: chatMessages,
    });
  }

  async findRoomsByOffset(
    findRoomDto: FindByOffsetDto,
  ): Promise<RoomResponseByOffset> {
    const {
      sort,
      alcoholCategory,
      moodCategory,
      page = 1,
      pageSize = 3,
      keyword,
    } = findRoomDto;

    const [totalItems, rooms] = await Promise.all([
      await this.prisma.chatRoom.count({
        where: this.getWhereCondition(keyword, alcoholCategory, moodCategory),
      }),
      await this.prisma.chatRoom.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        where: this.getWhereCondition(keyword, alcoholCategory, moodCategory),
        orderBy: this.getOrderByCondition(sort),
        select: {
          id: true,
          name: true,
          description: true,
          maxParticipants: true,
          theme: {
            select: {
              imageUrl: true,
            },
          },
          _count: {
            select: {
              participants: true,
            },
          },
        },
      }),
    ]);

    const data = rooms?.map((room) => ({
      id: room.id,
      name: room.name,
      description: room.description ? room.description : null,
      theme: room.theme.imageUrl,
      maxParticipants: room.maxParticipants,
      participants: room._count.participants,
    }));

    const totalPages = Math.ceil(totalItems / pageSize);
    const pagination: OffsetPagination = {
      totalItems,
      itemsPerPage: pageSize,
      currentPage: page,
      totalPages,
    };

    return { data, pagination };
  }

  async findRoomsByCursor(
    findRoomDto: FindByCursorDto,
  ): Promise<RoomResponseByCursor> {
    const {
      sort,
      alcoholCategory,
      moodCategory,
      cursor,
      limit = 6,
      keyword,
    } = findRoomDto;

    const rooms = await this.prisma.chatRoom.findMany({
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      where: this.getWhereCondition(keyword, alcoholCategory, moodCategory),
      orderBy: this.getOrderByCondition(sort),
      select: {
        id: true,
        name: true,
        description: true,
        maxParticipants: true,
        theme: {
          select: {
            imageUrl: true,
          },
        },
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    const hasNext = rooms.length > limit;
    const nextCursor = hasNext ? rooms[limit].id : null;
    const formattedData = rooms?.map((room) => ({
      id: room.id,
      name: room.name,
      description: room.description ? room.description : null,
      theme: room.theme.imageUrl,
      maxParticipants: room.maxParticipants,
      participants: room._count.participants,
    }));

    const data = hasNext ? formattedData?.slice(0, -1) : formattedData;
    const pagination: CursorPagination = { hasNext, nextCursor };

    return { data, pagination };
  }

  getOrderByCondition(sort: string): object {
    switch (sort) {
      case 'createdAt':
        return { createdAt: 'desc' };
      case 'popularAlcohol':
        return {
          alcoholCategory: {
            _count: 'desc',
          },
        };
      case 'participantCount':
        return {
          participants: {
            _count: 'desc',
          },
        };
      default:
        return { createdAt: 'desc' };
    }
  }

  getWhereCondition(
    keyword: string,
    alcoholCategory: string | undefined,
    moodCategory: string | undefined,
  ): object {
    return {
      name: { search: keyword },
      description: { search: keyword },
      deletedAt: null,
      ...(alcoholCategory && {
        alcoholCategory: {
          some: {
            alcoholCategoryId: {
              in: alcoholCategory?.split(',').map(Number),
            },
          },
        },
      }),
      ...(moodCategory && {
        moodCategory: {
          some: {
            moodCategoryId: {
              in: moodCategory?.split(',').map(Number),
            },
          },
        },
      }),
    };
  }

  async findParticipantById(userId: number): Promise<UserWithNickname> {
    const participant = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        profile: {
          select: {
            nickname: true,
          },
        },
      },
    });

    if (!participant) {
      throw new NotFoundException('참가자 정보를 찾을 수 없습니다.');
    }

    return {
      id: participant.id,
      nickname: participant.profile.nickname,
    };
  }

  getAccessTokenFromCookie(cookieHeader: string): string {
    const cookies = {};
    if (!cookieHeader) {
      throw new UnauthorizedException('쿠키가 존재하지 않습니다.');
    }
    const splitCookie = cookieHeader.split(';');
    splitCookie.forEach((cookie) => {
      const [key, value] = cookie.trim().split('=');
      cookies[key] = value;
    });

    return cookies['access_token'];
  }

  async findRoomById(roomId: number): Promise<RoomResponse> {
    if (!roomId) {
      throw new BadRequestException('유효하지 않은 채팅방 ID 값입니다.');
    }

    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId, deletedAt: null },
      select: {
        id: true,
        name: true,
        description: true,
        maxParticipants: true,
        theme: {
          select: {
            imageUrl: true,
          },
        },
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('채팅방을 찾을 수 없습니다.');
    }

    return {
      id: room.id,
      name: room.name,
      description: room.description,
      maxParticipants: room.maxParticipants,
      theme: room.theme.imageUrl,
      participants: room._count.participants,
    };
  }

  async findParticipants(roomId: number): Promise<UserWithNickname[]> {
    if (!roomId) {
      throw new BadRequestException('유효하지 않은 채팅방 ID 값입니다.');
    }

    const participants = await this.prisma.chatParticipant.findMany({
      where: { roomId },
      select: {
        userId: true,
        user: {
          select: {
            profile: {
              select: {
                nickname: true,
              },
            },
          },
        },
      },
    });

    if (participants.length === 0) {
      throw new NotFoundException('참가자를 찾을 수 없습니다.');
    }

    return participants.map((participant) => ({
      id: participant.userId,
      nickname: participant.user.profile.nickname,
    }));
  }
}
