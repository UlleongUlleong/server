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
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';
import { AlcoholDto } from './dtos/alcohol.dto';
import { ReviewDto } from './dtos/review.dto';
import { AuthenticateRequest } from '../auth/interfaces/authenticate-request.interface';

@Controller('alcohol')
export class AlcoholController {
  constructor(private alcoholService: AlcoholService) {}

  @Get()
  async findAlcohols(
    @Query() query: AlcoholQueryDto,
  ): Promise<ApiResponse<AlcoholDto[]>> {
    const { data, meta } = await this.alcoholService.getAlcohols(query);
    return {
      status: 'success',
      data: data,
      meta: meta,
      message: '술 메인페이지',
    };
  }

  @Get(':id')
  async findOneAlcohol(
    @Param('id', ParseIntPipe) id: number,
    @Query() query?: AlcoholQueryDto,
  ): Promise<
    ApiResponse<{
      alcoholInfo: AlcoholDto;
      reviewInfo: ReviewDto[];
    }>
  > {
    const { alcoholInfo, meta, reviewInfo } =
      await this.alcoholService.getAlcoholDetail(id, query);
    return {
      status: 'success',
      data: { alcoholInfo, reviewInfo },
      meta: meta,
      message: '특정 술 조회',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/reviews')
  async createReview(
    @Req() req: AuthenticateRequest,
    @Param('id', ParseIntPipe) alcoholId: number,
    @Body() reviewInfo: CreateReviewDto,
  ): Promise<ApiResponse<{ alcohol: AlcoholDto; reviews: ReviewDto[] }>> {
    const userId: number = req.user.sub;
    await this.alcoholService.createReview(userId, alcoholId, reviewInfo);
    return {
      status: 'success',
      data: null,
      message: '리뷰 작성완료',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/mark')
  async markStatus(
    @Req() req: AuthenticateRequest,
    @Param('id', ParseIntPipe) alcoholId: number,
  ): Promise<ApiResponse<boolean>> {
    const userId: number = req.user.sub;
    const isBookmarked = await this.alcoholService.markStatus(
      userId,
      alcoholId,
    );
    return {
      status: 'success',
      data: isBookmarked,
      message: isBookmarked ? '북마크' : '북마크가 취소되었습니다',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/mark')
  async findMark(
    @Req() req: AuthenticateRequest,
    @Param('id', ParseIntPipe) alcoholId: number,
  ): Promise<ApiResponse<boolean>> {
    const userId: number = req.user.sub;
    const markStatus = await this.alcoholService.findMarkStatus(
      userId,
      alcoholId,
    );
    return {
      status: 'success',
      data: markStatus,
      message: '북마크 조회완료',
    };
  }
}
