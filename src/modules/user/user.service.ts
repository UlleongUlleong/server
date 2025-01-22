import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import Redis from 'ioredis';
import * as bcrypt from 'bcrypt';
import { Prisma, Profile, User } from '@prisma/client';
import { EmailDto } from '../mail/dtos/email.dto';
import { NicknameDto } from './dtos/nickname.dto';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { ProfileDetail } from './interfaces/profile.interface';
import { UserPayload } from '../../common/interfaces/user-payload.interface';
import { CategoryService } from '../category/category.service';
import { PrismaService } from '../../common/modules/prisma/prisma.service';
import { QueryAlcoholDto } from './dtos/query.dto';
import { UserReviewDto } from './dtos/review.dto';
import { AlcoholInfoDto } from './dtos/alcoholInfo.dto';

@Injectable()
export class UserService {
  constructor(
    @Inject('REDIS_CLIENT') private redis: Redis,
    private prisma: PrismaService,
    private categoryService: CategoryService,
  ) {}

  async findProfileByNickname(nickname: string): Promise<Profile> {
    return await this.prisma.profile.findUnique({
      where: { nickname },
    });
  }

  async findProfileWithRelation(id: number): Promise<ProfileDetail> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        userAlcoholCategory: {
          include: {
            alcoholCategory: true,
          },
        },
        userMoodCategory: {
          include: {
            moodCategory: true,
          },
        },
      },
    });

    if (!user) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: '사용자를 찾을 수 없습니다.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      nickname: user.profile.nickname,
      moodCategory: user.userMoodCategory?.map((value) => ({
        id: value.moodCategory.id,
        name: value.moodCategory.name,
      })),
      alcoholCategory: user.userAlcoholCategory?.map((value) => ({
        id: value.alcoholCategory.id,
        name: value.alcoholCategory.name,
      })),
    };
  }

  async updateUserProfile(
    userId: number,
    updateProfileDto: UpdateProfileDto,
  ): Promise<void> {
    if (Object.keys(updateProfileDto).length === 0) {
      throw new BadRequestException('수정할 정보를 입력해주세요.');
    }

    const {
      nickname,
      alcoholCategory = [],
      moodCategory = [],
    } = updateProfileDto;

    await this.categoryService.checkAlocoholIdsExist(alcoholCategory);
    await this.categoryService.checkMoodIdsExist(moodCategory);

    await this.prisma.$transaction(async (tx) => {
      if (nickname) {
        await tx.profile.update({
          where: { userId },
          data: { nickname },
        });
      }

      await tx.userAlcoholCategory.deleteMany({
        where: { userId },
      });
      await tx.userMoodCategory.deleteMany({
        where: { userId },
      });

      await tx.userAlcoholCategory.createMany({
        data: alcoholCategory.map((value) => ({
          userId,
          alcoholCategoryId: value,
        })),
      });
      await tx.userMoodCategory.createMany({
        data: moodCategory.map((value) => ({
          userId,
          moodCategoryId: value,
        })),
      });
    });
  }

  async checkEmailDuplication(emailDto: EmailDto): Promise<void> {
    const { email } = emailDto;
    const user = await this.findUserByEmail(email);

    if (user) {
      throw new ConflictException('이미 가입이 완료된 계정입니다.');
    }
  }

  async findUserByEmail(email: string): Promise<User> {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findUserById(id: number): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: '사용자를 찾을 수 없습니다.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    return user;
  }

  async checkNicknameDuplication(nicknameDto: NicknameDto): Promise<void> {
    const { nickname } = nicknameDto;
    const profile = await this.findProfileByNickname(nickname);

    if (profile) {
      throw new ConflictException('이미 사용되고 있는 닉네임입니다.');
    }
  }

  async createEmailUser(createUserDto: CreateUserDto): Promise<void> {
    const {
      email,
      password,
      confirmPassword,
      nickname,
      alcoholCategory = [],
      moodCategory = [],
    } = createUserDto;
    const redisKey = `users:${email}:access_allowed`;
    const isAllowed = await this.redis.get(redisKey);
    if (!isAllowed || !Number(isAllowed)) {
      throw new UnauthorizedException('인증 후에 회원가입을 진행해주세요.');
    }

    if (!this.comparePassword(password, confirmPassword)) {
      throw new BadRequestException('입력한 비밀번호가 서로 다릅니다.');
    }

    const hash = await bcrypt.hash(password, 10);

    await this.createUser(
      email,
      hash,
      'local',
      nickname,
      alcoholCategory,
      moodCategory,
    );

    await this.redis.del(redisKey);
  }

  comparePassword(password: string, confirmPassword: string): boolean {
    return password === confirmPassword;
  }

  async createUser(
    email: string,
    password: string,
    provider: string,
    nickname: string,
    alcoholCategory: number[],
    moodCategory: number[],
  ): Promise<UserPayload> {
    await this.categoryService.checkAlocoholIdsExist(alcoholCategory);
    await this.categoryService.checkMoodIdsExist(moodCategory);

    const newUser: Prisma.UserCreateInput = {
      email,
      password,
      provider: {
        connect: { name: provider },
      },
      profile: {
        create: {
          nickname,
        },
      },
      userAlcoholCategory: {
        create: alcoholCategory.map((id) => ({
          alcoholCategory: { connect: { id } },
        })),
      },
      userMoodCategory: {
        create: moodCategory.map((id) => ({
          moodCategory: { connect: { id } },
        })),
      },
    };

    const user = await this.prisma.user.create({
      data: newUser,
    });

    return {
      sub: user.id,
    };
  }

  async updateUserStatus(id: number): Promise<boolean> {
    const user = await this.findUserById(id);
    const { isActive } = user;

    await this.prisma.user.update({
      where: { id },
      data: { isActive: !isActive },
    });

    return !isActive;
  }

  async deleteUser(id: number): Promise<void> {
    const user = await this.findUserById(id);
    const { email } = user;

    const redisKey = `users:${email}:access_allowed`;
    const isAllowed = await this.redis.get(redisKey);
    if (!isAllowed || !Number(isAllowed)) {
      throw new UnauthorizedException('인증 후에 탈퇴를 진행해주세요.');
    }

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.redis.del(redisKey);
  }

  async restoreUser(id: number): Promise<void> {
    const user = await this.findUserById(id);
    const { deletedAt } = user;

    if (deletedAt === null) {
      return;
    }

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async findInterest(
    id: number,
    query: QueryAlcoholDto,
  ): Promise<AlcoholInfoDto[]> {
    const interestAlcoholInfo = await this.prisma.userInterestAlcohol.findMany({
      where: { userId: id },
      take: query.limit ? Number(query.limit) : 5,
      cursor: query.cursor
        ? { userId_alcoholId: { userId: id, alcoholId: Number(query.cursor) } }
        : undefined,
      orderBy: { createdAt: 'asc' },
      select: {
        alcohol: {
          select: {
            id: true,
            name: true,
            scoreAverage: true,
            imageUrl: true,
          },
        },
      },
    });
    const alcoholInfoDtos: AlcoholInfoDto[] = interestAlcoholInfo.map(
      (item) => ({
        id: item.alcohol.id,
        name: item.alcohol.name,
        scoreAverage: item.alcohol.scoreAverage,
        imageUrl: item.alcohol.imageUrl,
      }),
    );
    return alcoholInfoDtos;
  }

  async findMyReview(
    id: number,
    query: QueryAlcoholDto,
  ): Promise<UserReviewDto[]> {
    const myReviewInfo = await this.prisma.userReviewAlochol.findMany({
      where: { userId: id },
      take: query.limit ? Number(query.limit) : 5,
      cursor: query.cursor ? { id: Number(query.cursor) } : undefined,
      orderBy: { id: 'asc' },
      select: {
        id: true,
        score: true,
        comment: true,
        alcoholId: true,
        alcohol: {
          select: {
            imageUrl: true,
            name: true,
          },
        },
      },
    });
    return myReviewInfo;
  }
}
