import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Max } from 'class-validator';

export class FindByOffsetDto {
  @IsOptional()
  @IsString({ message: '정렬 옵션은 문자열 형태입니다.' })
  sort?: string;

  @IsOptional()
  @Matches(/^\d+(,\d+)*$/, {
    message: '술 카테고리는 ,로 구분된 숫자 형태입니다.',
  })
  alcoholCategory?: string;

  @IsOptional()
  @Matches(/^\d+(,\d+)*$/, {
    message: '분위기 카테고리는 ,로 구분된 숫자 형태입니다.',
  })
  moodCategory?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt({ message: '페이지는 정수 형태입니다.' })
  page?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt({ message: '데이터 개수는 정수 형태입니다.' })
  @Max(50, { message: '데이터 개수는 최대 50개입니다.' })
  pageSize?: number;

  @IsOptional()
  @IsString({ message: '키워드는 문자열 형태입니다.' })
  keyword?: string;
}
