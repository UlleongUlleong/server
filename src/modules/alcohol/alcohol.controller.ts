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
} from '@nestjs/common';
import { AlcoholService } from './alcohol.service';
import { AlcoholQueryDto } from './dtos/alcohol-query.dto';
import { CreateReviewDto } from './dtos/create-review.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CustomResponse } from 'src/common/interfaces/api-response.interface';
import { AlcoholDto } from './dtos/alcohol.dto';
import { ReviewDto } from './dtos/review.dto';
import { AuthenticateRequest } from '../auth/interfaces/authenticate-request.interface';

@Controller('alcohol')
export class AlcoholController {
  constructor(private alcoholService: AlcoholService) {}

  @Get()
  async findAlcohols(
    @Query() query: AlcoholQueryDto,
  ): Promise<CustomResponse<AlcoholDto[]>> {
    const info = await this.alcoholService.getAlcohols(query);
    return {
      data: info,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOneAlcohol(
    @Req() req: AuthenticateRequest,
    @Param('id', ParseIntPipe) id: number,
    @Query('cursor') cursor?: number,
  ): Promise<
    CustomResponse<{
      alcoholInfo: AlcoholDto;
      reviewInfo: ReviewDto[];
      markStatus: boolean;
    }>
  > {
    const userId: number = req.user.sub;
    const { alcoholInfo, reviewInfo } =
      await this.alcoholService.getAlcoholDetail(id, cursor);
    const markStatus = await this.alcoholService.findMarkStatus(userId, id);
    return {
      data: { alcoholInfo, reviewInfo, markStatus },
      message: '특정 술 조회',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/reviews')
  async createReview(
    @Req() req: AuthenticateRequest,
    @Param('id', ParseIntPipe) alcoholId: number,
    @Body() reviewInfo: CreateReviewDto,
  ): Promise<CustomResponse<{ alcohol: AlcoholDto; reviews: ReviewDto[] }>> {
    const userId: number = req.user.sub;
    const { alcohol, reviews } = await this.alcoholService.createReview(
      userId,
      alcoholId,
      reviewInfo,
    );
    return {
      data: { alcohol, reviews },
      message: '리뷰 작성완료',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/mark')
  async markStatus(
    @Req() req: AuthenticateRequest,
    @Param('id', ParseIntPipe) alcoholId: number,
  ): Promise<CustomResponse<object>> {
    const userId: number = req.user.sub;
    const isBookmarked = await this.alcoholService.markStatus(
      userId,
      alcoholId,
    );
    return {
      data: null,
      message: isBookmarked
        ? '북마크가 추가되었습니다'
        : '북마크가 취소되었습니다',
    };
  }
}
