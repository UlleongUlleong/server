import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/modules/prisma.service';
import { AlcoholDto } from './dtos/alcohol.dto';

@Injectable()
export class AlcoholService {
  constructor(private prisma: PrismaService) {}

  async getAlcohol(): Promise<AlcoholDto> {
    const start = 0;
    const alcoholInfo: AlcoholDto = {};
    alcoholInfo.total = await this.findByRating(start, 0);
    alcoholInfo.beer = await this.findByRating(start, 1);
    alcoholInfo.beer = await this.findByRating(start, 2);
    alcoholInfo.whiskey = await this.findByRating(start, 3);
    alcoholInfo.wine = await this.findByRating(start, 4);
    alcoholInfo.makgeolli = await this.findByRating(start, 5);
    // const etc = await this.findByRating(start, 6);
    console.log(alcoholInfo);
    return alcoholInfo;
  }

  async findByRating(start, type) {
    const alcohol = await this.prisma.alcohol.findMany({
      skip: start ? start : 0,
      take: 5,
      where: {
        alcoholCategoryId: type ? type : undefined,
      },
      orderBy: {
        ratingAverage: 'desc',
      },
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
}
