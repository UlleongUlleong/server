import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Prisma, Profile, User } from '@prisma/client';
import { PrismaService } from '../../common/modules/prisma.service';
import { EmailDto } from './dtos/email.dto';
import { CategoryDto } from './dtos/category.dto';
import { NicknameDto } from './dtos/nickname.dto';
import { CreateUserDto } from './dtos/create-user.dto';
import { ResponseProfileDto } from './dtos/responseProfile.dto';
import { UserPayload } from '../../common/interfaces/user-payload.interface';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findUserProfile(userId: number): Promise<ResponseProfileDto | null> {
    const getUserAlcohol = await this.prisma.userAlcoholCategory.findMany({
      where: { userId: userId },
      select: {
        alcoholCategory: true,
      },
    });
    const getUserMood = await this.prisma.userMoodCategory.findMany({
      where: { userId: userId },
      select: {
        moodCategory: true,
      },
    });

    const alcoholCategory = getUserAlcohol.map((item) => {
      const { id, name } = item.alcoholCategory;
      return { id, name };
    });

    const moodCategory = getUserMood.map((item) => {
      const { id, name } = item.moodCategory;
      return { id, name };
    });
    return {
      moodCategory: moodCategory,
      alcoholCategory: alcoholCategory,
    };
  }

  async updateUserProfile(
    userId: number,
    categoryDto: CategoryDto,
  ): Promise<ResponseProfileDto | null> {
    await this.prisma.userAlcoholCategory.deleteMany({
      where: {
        userId: userId,
      },
    });
    await this.prisma.userMoodCategory.deleteMany({
      where: {
        userId: userId,
      },
    });
    await this.createUserProfile(userId, categoryDto);
    return await this.findUserProfile(userId);
  }

  async createUserProfile(
    userId: number,
    categoryDto: CategoryDto,
  ): Promise<void> {
    const { alcoholCategory, moodCategory } = categoryDto;
    await this.prisma.userAlcoholCategory.createMany({
      data: alcoholCategory.map((item) => ({
        userId: userId,
        alcoholCategoryId: item,
      })),
    });
    await this.prisma.userMoodCategory.createMany({
      data: moodCategory.map((item) => ({
        userId: userId,
        moodCategoryId: item,
      })),
    });
    return;
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

  async checkNicknameDuplication(nicknameDto: NicknameDto): Promise<void> {
    const { nickname } = nicknameDto;
    const profile = await this.findProfileByNickname(nickname);

    if (profile) {
      throw new ConflictException('이미 사용되고 있는 닉네임입니다.');
    }
  }

  async findProfileByNickname(nickname: string): Promise<Profile> {
    return await this.prisma.profile.findUnique({
      where: { nickname },
    });
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

    if (!this.comparePassword(password, confirmPassword)) {
      throw new BadRequestException('입력한 비밀번호가 서로 다릅니다.');
    }

    await this.createUser(
      email,
      password,
      'local',
      nickname,
      alcoholCategory,
      moodCategory,
    );
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
          provider: user.provider.name,
          nickname: user.profile.nickname,
          imageUrl: user.profile.imageUrl,
        };
      },
    );

    return createdUserWithProfile;
  }
}
