import { ResPonseCursorDto } from 'src/modules/alcohol/dtos/response-cursor.dto';
import { AlcoholInfoDto } from './alcoholInfo.dto';

export class ResponseInterestDto {
  alcoholInfoDtos: AlcoholInfoDto[];
  meta: ResPonseCursorDto;
}
