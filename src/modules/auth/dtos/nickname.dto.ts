import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class NicknameDto {
  @IsNotEmpty({ message: '닉네임은 반드시 있어야 합니다.' })
  @IsString({ message: '닉네임은 문자열 형태여야 합니다.' })
  @MinLength(2, { message: '닉네임은 2자 이상이어야 합니다.' })
  @MaxLength(30, { message: '닉네임은 30자 이하여야 합니다.' })
  @Matches(/^[a-zA-Z0-9가-힣]+$/, {
    message: '닉네임은 한글, 영어, 숫자만 포함할 수 있습니다.',
  })
  nickname: string;
}
