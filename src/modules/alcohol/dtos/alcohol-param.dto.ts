import { IsInt } from 'class-validator';
import { Transform } from 'class-transformer';

export class AlcoholParamDto {
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  id: number;
}
