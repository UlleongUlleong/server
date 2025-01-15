import { Controller, Get } from '@nestjs/common';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';
import { AlcoholService } from './alcohol.service';

@Controller('alcohol')
export class AlcoholController {
  constructor(private alcoholService: AlcoholService) {}

  @Get('')
  async getAlcohol(): Promise<ApiResponse<object>> {
    const info = await this.alcoholService.getAlcohol();
    return {
      status: 'success',
      data: info,
      message: '술 메인 페이지',
    };
  }
}
