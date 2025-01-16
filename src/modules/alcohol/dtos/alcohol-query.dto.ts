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
  @IsIn(['name', 'createdAt', 'reviewCount', 'scoreAverage', 'interestCount'])
  sort?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  offset?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number = 4;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  cursor?: number;
}
