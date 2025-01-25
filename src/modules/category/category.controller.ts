import { Controller, Get } from '@nestjs/common';
import { HttpContent } from '../../common/interfaces/http-response.interface';
import { CategoryService } from './category.service';

@Controller('categories')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Get('alcohol')
  async getAlcoholCategory(): Promise<HttpContent<object>> {
    const alcohol = await this.categoryService.getAlcoholCategory();
    return {
      data: alcohol,
      message: '술 카테고리 조회 성공',
    };
  }

  @Get('moods')
  async getMoodCategory(): Promise<HttpContent<object>> {
    const mood = await this.categoryService.getMoodCategory();
    return {
      data: mood,
      message: '분위기 카테고리 조회 성공',
    };
  }
}
