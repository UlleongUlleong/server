import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateReviewDto {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  score: number;

  @IsNotEmpty()
  @IsString()
  review: string;
}
