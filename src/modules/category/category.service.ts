import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/modules/prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getAlcoholCategory(): Promise<object> {
    const alcoholCategory = await this.prisma.alcoholCategory.findMany({
      select: { id: true, name: true },
    });
    return alcoholCategory;
  }

  async getMoodCategory(): Promise<object> {
    const moodCategory = await this.prisma.moodCategory.findMany({
      select: { id: true, name: true },
    });
    return moodCategory;
  }

  async checkAlocoholIdsExist(ids: number[]): Promise<void> {
    const count = await this.prisma.alcoholCategory.count({
      where: { id: { in: ids } },
    });

    if (count !== ids.length) {
      throw new BadRequestException('술 카테고리의 값이 유효하지 않습니다.');
    }
  }

  async checkMoodIdsExist(ids: number[]): Promise<void> {
    const count = await this.prisma.moodCategory.count({
      where: { id: { in: ids } },
    });

    if (count !== ids.length) {
      throw new BadRequestException(
        '분위기 카테고리의 값이 유효하지 않습니다.',
      );
    }
  }
}
