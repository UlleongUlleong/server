import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/modules/prisma/prisma.service';
import { AlcoholQueryDto } from './dtos/Alcohol-query.dto';
import { AlcoholDto } from './dtos/alcohol.dto';
import { CreateReviewDto } from './dtos/create-review.dto';
import { ReviewDto } from './dtos/review.dto';

@Injectable()
export class AlcoholService {
  constructor(private prisma: PrismaService) {}

  async getAlcohols(query: AlcoholQueryDto): Promise<AlcoholDto[]> {
    const alcoholList = await this.findAlcohol(query);

    return alcoholList.map((alcohol) => ({
      id: alcohol.id,
      name: alcohol.name,
      alcoholCategory: alcohol.alcoholCategory,
      scoreAverage: parseFloat(alcohol.scoreAverage.toFixed(1)),
      reviewCount: alcohol.reviewCount,
      imageUrl: alcohol.imageUrl,
    }));
  }

  async findAlcohol(query): Promise<any[]> {
    const { category, keyword, sort, offset, limit, cursor } = query;
    return await this.prisma.alcohol.findMany({
      skip: cursor ? undefined : Number(offset) || 0,
      take: limit || 5,
      cursor: cursor ? { id: Number(cursor) } : undefined,
      where: {
        alcoholCategoryId: category ? Number(category) : undefined,
        name: {
          contains: keyword || undefined,
        },
      },
      orderBy: sort ? { [sort]: 'desc' } : { name: 'desc' },
      select: {
        id: true,
        alcoholCategory: {
          select: {
            id: true,
            name: true,
          },
        },
        name: true,
        scoreAverage: true,
        reviewCount: true,
        imageUrl: true,
      },
    });
  }

  async getAlcoholDetail(
    id: number,
    cursor?: number,
  ): Promise<{ alcoholInfo: AlcoholDto; reviewInfo: ReviewDto[] }> {
    if (cursor) {
      cursor = Number(cursor);
    }
    const alcoholInfo = await this.findAlcoholById(id);
    const reviewInfo = await this.getReview(id, cursor);
    return { alcoholInfo, reviewInfo };
  }

  async findAlcoholById(id: number): Promise<AlcoholDto> {
    const alcoholInfo = await this.prisma.alcohol.findUnique({
      where: { id },
      select: {
        id: true,
        alcoholCategory: {
          select: {
            id: true,
            name: true,
          },
        },
        name: true,
        price: true,
        origin: true,
        scoreAverage: true,
        reviewCount: true,
        interestCount: true,
        imageUrl: true,
        abv: true,
        volume: true,
        description: true,
      },
    });

    return {
      id: alcoholInfo.id,
      name: alcoholInfo.name,
      alcoholCategory: alcoholInfo.alcoholCategory,
      scoreAverage: parseFloat(alcoholInfo.scoreAverage.toFixed(1)),
      reviewCount: alcoholInfo.reviewCount,
      imageUrl: alcoholInfo.imageUrl,
    };
  }

  async createReview(
    userId: number,
    alcoholId: number,
    reviewInfo: CreateReviewDto,
  ): Promise<{ alcohol: AlcoholDto; reviews: ReviewDto[] }> {
    await this.prisma.userReviewAlochol.create({
      data: {
        score: reviewInfo.score,
        comment: reviewInfo.review,
        userId,
        alcoholId,
      },
    });

    const alcoholInfo = await this.prisma.alcohol.findUnique({
      where: { id: alcoholId },
      select: {
        scoreAverage: true,
        scoreCount: true,
        reviewCount: true,
      },
    });

    const newAverage =
      (alcoholInfo.scoreCount * alcoholInfo.scoreAverage + reviewInfo.score) /
      (alcoholInfo.scoreCount + 1);

    await this.prisma.alcohol.update({
      where: { id: alcoholId },
      data: {
        reviewCount: alcoholInfo.reviewCount + 1,
        scoreCount: alcoholInfo.scoreCount + 1,
        scoreAverage: newAverage,
      },
    });

    const reviews = await this.getReview(alcoholId);
    const alcohol = await this.findAlcoholById(alcoholId);
    return { alcohol, reviews };
  }

  async getReview(alcoholId: number, cursor?: number): Promise<ReviewDto[]> {
    const reviews = await this.prisma.userReviewAlochol.findMany({
      where: { alcoholId },
      take: 5,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        score: true,
        comment: true,
      },
    });

    return reviews.map((review) => ({
      id: review.id,
      score: review.score,
      comment: review.comment,
    }));
  }

  async markStatus(userId: number, alcoholId: number): Promise<boolean> {
    const isExist = await this.prisma.userInterestAlcohol.findUnique({
      where: { userId_alcoholId: { userId, alcoholId } },
    });
    if (isExist) {
      await this.prisma.userInterestAlcohol.delete({
        where: { userId_alcoholId: { userId, alcoholId } },
      });
      return false;
    }
    await this.prisma.userInterestAlcohol.create({
      data: { userId, alcoholId },
    });
    return true;
  }
}
