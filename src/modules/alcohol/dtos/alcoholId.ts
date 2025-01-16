import { Type } from 'class-transformer';
import { IsNumber, IsNotEmpty } from 'class-validator';
export class AlcoholId {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  alcoholId: number;
}
