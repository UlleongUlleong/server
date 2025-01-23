import { Controller, Get } from '@nestjs/common';
import { CustomResponse } from '../../common/interfaces/api-response.interface';
import { CategoryService } from './category.service';

@Controller('categories')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Get('alcohol')
  async getAlcoholCategory(): Promise<CustomResponse<object>> {
    const alcohol = await this.categoryService.getAlcoholCategory();
    return {
      data: alcohol,
      message: '술 카테고리 조회 성공',
    };
  }

  @Get('moods')
  async getMoodCategory(): Promise<CustomResponse<object>> {
    const mood = await this.categoryService.getMoodCategory();
    return {
      data: mood,
      message: '분위기 카테고리 조회 성공',
    };
  }
}
