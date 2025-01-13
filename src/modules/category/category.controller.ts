import { Controller, Get } from '@nestjs/common';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';
import { CategoryService } from './category.service';

@Controller('categories')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Get('alcohol')
  async getAlcoholCategory(): Promise<ApiResponse<object>> {
    const alcohol = await this.categoryService.getAlcoholCategory();
    return {
      status: 'success',
      data: alcohol,
      message: '술 카테고리 조회',
    };
  }

  @Get('moods')
  async getMoodCategory(): Promise<ApiResponse<object>> {
    const mood = await this.categoryService.getMoodCategory();
    return {
      status: 'success',
      data: mood,
      message: '분위기 카테고리 조회',
    };
  }
}
