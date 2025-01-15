import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma, Profile, User } from '@prisma/client';
import { PrismaService } from '../../common/modules/prisma/prisma.service';
import { EmailDto } from '../mail/dtos/email.dto';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { NicknameDto } from './dtos/nickname.dto';
import { CreateUserDto } from './dtos/create-user.dto';
import { UserPayload } from '../../common/interfaces/user-payload.interface';
import { ProfileDetail } from './interfaces/profile.interface';
import { MailService } from '../mail/mail.service';
import Redis from 'ioredis';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    @Inject('REDIS_CLIENT') private redis: Redis,
    private mailService: MailService,
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
          message: '인증 코드가 만료됐습니다.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    console.log(user);

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
    return await this.prisma.user.findUnique({
      where: { id },
    });
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

    const createdUserWithProfile = await this.prisma.$transaction(
      async (tx) => {
        const user = await tx.user.create({
          data: newUser,
          include: {
            provider: true,
            profile: true,
          },
        });

        return {
          id: user.id,
          isActive: user.isActive,
          provider: user.provider.name,
          nickname: user.profile.nickname,
          imageUrl: user.profile.imageUrl,
        };
      },
    );

    return createdUserWithProfile;
  }

  async updateUserStatus(id: number): Promise<boolean> {
    const { isActive } = await this.findUserById(id);

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
}
