import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/modules/prisma/prisma.service';
import { AlcoholQueryDto } from './dtos/alcohol-query.dto';
import { Alcohol } from './inerfaces/alcohol.interface';
import { CreateReviewDto } from './dtos/create-review.dto';
import { Review } from './inerfaces/review.interface';
import {
  CursorPagination,
  OffsetPagination,
  Pagination,
} from 'src/common/interfaces/pagination.interface';

@Injectable()
export class AlcoholService {
  constructor(private prisma: PrismaService) {}

  async getAlcohols(query: AlcoholQueryDto): Promise<{
    data: Alcohol[];
    pagination: Pagination;
  }> {
    const alcoholList = await this.findAlcohol(query);

    const pagination = query.cursor
      ? await this.createCursorMeta(query, alcoholList)
      : await this.createOffsetMeta(query);

    const alcoholDtos: Alcohol[] = alcoholList.map((alcohol) => ({
      id: alcohol.id,
      name: alcohol.name,
      alcoholCategory: alcohol.alcoholCategory,
      scoreAverage: parseFloat(alcohol.scoreAverage.toFixed(1)),
      reviewCount: alcohol.reviewCount,
      imageUrl: alcohol.imageUrl,
    }));

    return { data: alcoholDtos, pagination };
  }

  async createOffsetMeta(query: AlcoholQueryDto): Promise<OffsetPagination> {
    const totalAlcohols = await this.prisma.alcohol.count({
      where: {
        alcoholCategoryId: query.category ? Number(query.category) : undefined,
        name: query.keyword ? { contains: query.keyword } : undefined,
      },
    });

    const totalPages = Math.ceil(totalAlcohols / (query.limit || 10));

    const page = query.offset
      ? Math.floor(Number(query.offset) / (query.limit || 10)) + 1
      : 1;

    return {
      totalItems: totalAlcohols,
      itemsPerPage: query.limit || 10,
      currentPage: page,
      totalPages: totalPages,
    };
  }

  async createCursorMeta(
    query: AlcoholQueryDto,
    alcoholList: { id: number }[],
  ): Promise<CursorPagination> {
    const lastAlcohol = alcoholList[alcoholList.length - 1];
    const nextCursor = lastAlcohol ? lastAlcohol.id : null;

    const hasNext = alcoholList.length === query.limit;

    return {
      hasNext: hasNext,
      nextCursor: nextCursor + 1,
    };
  }

  async findAlcohol(query: AlcoholQueryDto): Promise<Alcohol[]> {
    const { category, keyword, sort, offset, limit, cursor } = query;
    const whereConditions = {
      alcoholCategoryId: category ? Number(category) : undefined,
      name: keyword ? { contains: keyword } : undefined,
    };
    const paginationParams = {
      skip: offset ? Number(offset) : undefined,
      take: Number(limit) || 10,
      cursor: cursor ? { id: Number(cursor) } : undefined,
    };
    const orderParams: any = sort ? { [sort]: 'asc' } : { createdAt: 'asc' };
    return await this.prisma.alcohol.findMany({
      where: whereConditions,
      ...paginationParams,
      orderBy: orderParams,
      select: {
        id: true,
        name: true,
        alcoholCategory: {
          select: {
            id: true,
            name: true,
          },
        },
        scoreAverage: true,
        reviewCount: true,
        imageUrl: true,
      },
    });
  }

  async findAlcoholById(id: number): Promise<Alcohol> {
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
      price: alcoholInfo.price,
      origin: alcoholInfo.origin,
      interestCount: alcoholInfo.interestCount,
      abv: alcoholInfo.abv,
      volume: alcoholInfo.volume,
      description: alcoholInfo.description,
    };
  }

  async createReview(
    userId: number,
    alcoholId: number,
    reviewInfo: CreateReviewDto,
  ): Promise<{ alcohol: Alcohol; reviews: Review[] }> {
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
    return;
  }

  async getReview(
    alcoholId: number,
    query: AlcoholQueryDto,
  ): Promise<{ reviewInfo: Review[]; pagination: CursorPagination }> {
    const reviews = await this.prisma.userReviewAlochol.findMany({
      where: { alcoholId },
      take: query.limit ? Number(query.limit) : 5,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        score: true,
        comment: true,
        user: {
          select: {
            profile: {
              select: {
                nickname: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });
    const reviewInfo: Review[] = reviews.map((review) => ({
      id: review.id,
      score: review.score,
      comment: review.comment,
      user: {
        nickname: review.user.profile.nickname,
        imageUrl: review.user.profile.imageUrl,
      },
    }));
    const pagination = await this.createCursorMeta(query, reviews);
    return { reviewInfo, pagination };
  }

  async markStatus(userId: number, alcoholId: number): Promise<boolean> {
    const isExist = await this.prisma.userInterestAlcohol.findUnique({
      where: { userId_alcoholId: { userId, alcoholId } },
    });
    if (isExist) {
      await this.prisma.userInterestAlcohol.delete({
        where: { userId_alcoholId: { userId, alcoholId } },
      });
      await this.subMark(alcoholId);
      return false;
    }
    await this.prisma.userInterestAlcohol.create({
      data: { userId, alcoholId },
    });
    await this.addMark(alcoholId);
    return true;
  }

  async findMarkStatus(userId: number, alcoholId: number): Promise<boolean> {
    const isExist = await this.prisma.userInterestAlcohol.findUnique({
      where: { userId_alcoholId: { userId, alcoholId } },
    });
    if (isExist) {
      return true;
    }
    return false;
  }

  async addMark(alcoholId: number): Promise<void> {
    const alcoholInfo = await this.prisma.alcohol.findUnique({
      where: { id: alcoholId },
      select: {
        interestCount: true,
      },
    });
    await this.prisma.alcohol.update({
      where: { id: alcoholId },
      data: {
        interestCount: alcoholInfo.interestCount + 1,
      },
    });
    return;
  }

  async subMark(alcoholId: number): Promise<void> {
    const alcoholInfo = await this.prisma.alcohol.findUnique({
      where: { id: alcoholId },
      select: {
        interestCount: true,
      },
    });
    await this.prisma.alcohol.update({
      where: { id: alcoholId },
      data: {
        interestCount: alcoholInfo.interestCount - 1,
      },
    });
    return;
  }
}
