import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { ResponseProfileDto } from './dtos/profile.dto';

@Injectable()
export class UsersService {
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
    return {
      moodCategory: getUserMood.map((item) => item.moodCategory),
      alcoholCategory: getUserAlcohol.map((item) => item.alcoholCategory),
    };
  }

  async updateUserProfile(
    userId: number,
    alcoholCategory: number[],
    moodCategory: number[],
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
    await this.createUserProfile(userId, alcoholCategory, moodCategory);
    return await this.findUserProfile(userId);
  }

  async createUserProfile(
    userId: number,
    alcoholCategory: number[],
    moodCategory: number[],
  ): Promise<void> {
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
}
