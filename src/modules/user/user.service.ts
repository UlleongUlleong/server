import { Injectable } from '@nestjs/common';
import { ResponseProfileDto } from './dtos/responseProfile.dto';
import { CategoryDto } from './dtos/category.dto';
import { PrismaService } from '../../common/modules/prisma.service';

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
}
