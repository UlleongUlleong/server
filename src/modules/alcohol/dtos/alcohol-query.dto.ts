import { IsOptional, IsInt, IsString, IsIn } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class AlcoholQueryDto {
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => (value === '' ? null : value))
  @Type(() => Number)
  category?: number;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsIn(['name', 'recent', 'review', 'star'])
  sort?: string;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => (value === '' ? null : value))
  @Type(() => Number)
  offset?: number;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => (value === '' ? null : value))
  @Type(() => Number)
  limit: number = 4;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => (value === '' ? null : value))
  @Type(() => Number)
  cursor?: number;
}
