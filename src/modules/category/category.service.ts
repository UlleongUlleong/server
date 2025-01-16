import { Injectable } from '@nestjs/common';
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
    const moodCategory = await this.prisma.alcoholCategory.findMany({
      select: { id: true, name: true },
    });
    return moodCategory;
  }
}
