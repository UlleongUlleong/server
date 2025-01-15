import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';
import { AlcoholService } from './alcohol.service';
import { AlcoholQueryDto } from './dtos/alcohol-query.dto';

@Controller('alcohol')
export class AlcoholController {
  constructor(private alcoholService: AlcoholService) {}

  @Get()
  async findAlcohols(
    @Query() query: AlcoholQueryDto,
  ): Promise<ApiResponse<object>> {
    console.log(query);
    const info = await this.alcoholService.getAlcohols(query);
    return {
      status: 'success',
      data: info,
      message: '술 메인페이지',
    };
  }

  @Get(':id')
  async findOneAlcohol(@Param('id') id: number): Promise<ApiResponse<object>> {
    console.log(id);
    const info = await this.alcoholService.findAlcoholById(Number(id));
    return {
      status: 'success',
      data: info,
      message: '특정 술 조회',
    };
  }
}
