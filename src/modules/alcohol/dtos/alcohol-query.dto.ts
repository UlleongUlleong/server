import { IsOptional, IsInt, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class AlcoholQueryDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  category?: number;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsIn(['name', 'createdAt', 'reviewCount', 'scoreAverage', 'interestCount'], {
    message:
      'sort는 "name", "createdAt", "reviewCount", "scoreAverage", "interestCount" 중 하나여야 합니다.',
  })
  sort?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  offset?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  cursor?: number;
}
