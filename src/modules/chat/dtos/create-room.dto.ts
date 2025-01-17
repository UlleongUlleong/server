import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateRoomDto {
  @IsNotEmpty({ message: '채팅방 이름은 필수 항목입니다.' })
  @IsString({ message: '채팅방 이름은 문자열입니다.' })
  @MaxLength(50, { message: '채팅방 이름은 50글자 이내입니다.' })
  name: string;

  @IsNotEmpty({ message: '채팅방 테마 ID는 필수 항목입니다.' })
  @IsInt({ message: '채팅방 테마 ID는 정수입니다.' })
  themeId: number;

  @IsNotEmpty({ message: '채팅방 최대 인원은 필수 항목입니다.' })
  @IsInt({ message: '채팅방 최대 인원은 정수입니다.' })
  @Min(2, { message: '최대 인원은 2 이상이어야 합니다.' })
  @Max(10, { message: '최대 인원은 10 이하여야 합니다.' })
  maxParticipants: number;

  @IsOptional()
  @IsString({ message: '채팅방 설명은 문자열입니다.' })
  @MaxLength(200, { message: '채팅방 설명은 200자 이하여야 합니다.' })
  description: string;

  @IsOptional()
  @IsArray({ message: '술 카테고리는 배열 형태여야 합니다.' })
  @IsInt({
    each: true,
    message: '술 카테고리의 배열은 정수형만 포함할 수 있습니다.',
  })
  alcoholCategory: number[];

  @IsOptional()
  @IsArray({ message: '분위기 카테고리는 배열 형태여야 합니다.' })
  @IsInt({
    each: true,
    message: '분위기 카테고리의 배열은 정수형만 포함할 수 있습니다.',
  })
  moodCategory: number[];
}
