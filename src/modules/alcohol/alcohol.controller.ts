import {
  Post,
  Body,
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { AlcoholService } from './alcohol.service';
import { AlcoholQueryDto } from './dtos/alcohol-query.dto';
import { CreateReviewDto } from './dtos/create-review.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { HttpContent } from '../../common/interfaces/http-response.interface';
import { AuthenticateRequest } from '../auth/interfaces/authenticate-request.interface';
import { Alcohol } from './inerfaces/alcohol.interface';
import { Review } from './inerfaces/review.interface';

@Controller('alcohol')
export class AlcoholController {
  constructor(private alcoholService: AlcoholService) {}

  @Get()
  async findAlcohols(
    @Query() query: AlcoholQueryDto,
  ): Promise<HttpContent<Alcohol[]>> {
    const { data, pagination } = await this.alcoholService.getAlcohols(query);
    return {
      data: data,
      pagination,
      message: '술 메인페이지',
    };
  }

  @Get(':id/reviews')
  async findOneAlcohol(
    @Param('id', ParseIntPipe) id: number,
    @Query() query?: AlcoholQueryDto,
  ): Promise<HttpContent<Review[]>> {
    const { pagination, reviewInfo } = await this.alcoholService.getReview(
      id,
      query,
    );

    return {
      data: reviewInfo,
      pagination,
    };
  }

  @Get(':id')
  async alcoholDetail(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<HttpContent<Alcohol>> {
    const alcoholInfo = await this.alcoholService.findAlcoholById(id);
    return {
      data: alcoholInfo,
      message: '술 상세조회',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/reviews')
  async createReview(
    @Req() req: AuthenticateRequest,
    @Param('id', ParseIntPipe) alcoholId: number,
    @Body() reviewInfo: CreateReviewDto,
  ): Promise<HttpContent<{ alcohol: Alcohol; reviews: Review[] }>> {
    const userId: number = req.user.id;
    await this.alcoholService.createReview(userId, alcoholId, reviewInfo);
    return {
      data: null,
      message: '리뷰 작성완료',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/mark')
  async markStatus(
    @Req() req: AuthenticateRequest,
    @Param('id', ParseIntPipe) alcoholId: number,
  ): Promise<HttpContent<boolean>> {
    const userId: number = req.user.id;
    const isBookmarked = await this.alcoholService.markStatus(
      userId,
      alcoholId,
    );
    return {
      data: isBookmarked,
      message: isBookmarked ? '북마크' : '북마크가 취소되었습니다',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/mark')
  async findMark(
    @Req() req: AuthenticateRequest,
    @Param('id', ParseIntPipe) alcoholId: number,
  ): Promise<HttpContent<boolean>> {
    const userId: number = req.user.id;
    const markStatus = await this.alcoholService.findMarkStatus(
      userId,
      alcoholId,
    );
    return {
      data: markStatus,
      message: '북마크 조회완료',
    };
  }
}
