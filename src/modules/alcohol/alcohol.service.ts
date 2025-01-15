import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/modules/prisma.service';
import { AlcoholQueryDto } from './dtos/Alcohol-query.dto';
import { AlcoholDto } from './dtos/alcohol.dto';

@Injectable()
export class AlcoholService {
  constructor(private prisma: PrismaService) {}

  async getAlcohols(query: AlcoholQueryDto): Promise<object> {
    const { category, keyword, sort, offset, limit, cursor } = query;
    const alcoholCategories = [
      'total',
      'soju',
      'beer',
      'whiskey',
      'wine',
      'makgeolli',
    ];
    let sortOptions = {};
    if (sort) {
      switch (sort) {
        case 'star':
          sortOptions = { ratingAverage: 'desc' };
          break;
        case 'review':
          sortOptions = { reviewCount: 'desc' };
          break;
        case 'interest':
          sortOptions = { interestCount: 'desc' };
          break;
        case 'createdAt':
          sortOptions = { createdAt: 'desc' };
          break;
        default:
          sortOptions = { name: 'desc' };
      }
    }

    const finalOffset = cursor ? cursor : offset || 0;
    const alcoholInfo: AlcoholDto = {};
    if (!category && !keyword && !finalOffset && !limit) {
      alcoholInfo.total = await this.findAlcohol(undefined, sortOptions);
      alcoholInfo.soju = await this.findAlcohol(1, sortOptions);
      alcoholInfo.beer = await this.findAlcohol(2, sortOptions);
      alcoholInfo.whiskey = await this.findAlcohol(3, sortOptions);
      alcoholInfo.wine = await this.findAlcohol(4, sortOptions);
      alcoholInfo.makgeolli = await this.findAlcohol(5, sortOptions);
    } else if (category) {
      alcoholInfo[alcoholCategories[category]] = await this.findAlcohol(
        category,
        sortOptions,
      );
    }
    return alcoholInfo;
  }

  async findAlcohol(
    category?: number,
    sortOptions?: any,
    finalOffset?: number,
  ) {
    const alcohol = await this.prisma.alcohol.findMany({
      skip: finalOffset ? finalOffset : 0,
      take: 5,
      where: {
        alcoholCategoryId: category ? Number(category) : undefined,
      },
      orderBy: sortOptions,
      select: {
        id: true,
        alcoholCategoryId: true,
        name: true,
        price: true,
        description: true,
        origin: true,
        ratingAverage: true,
        reviewCount: true,
        interestCount: true,
        imageUrl: true,
        createdAt: false,
      },
    });
    return alcohol;
  }

  async findAlcoholById(id: number) {
    return await this.prisma.alcohol.findUnique({
      where: { id },
    });
  }
}
