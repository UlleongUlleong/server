import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: '이메일은 필수 항목입니다.' })
  @IsEmail({}, { message: '이메일 형식으로 입력해야 합니다.' })
  email: string;

  @IsNotEmpty({ message: '비밀번호는 필수 항목입니다.' })
  @IsString({ message: '비밀번호는 문자열 형태여야 합니다.' })
  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다.' })
  @MaxLength(20, { message: '비밀번호는 20자 이하여야 합니다.' })
  @Matches(/(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[@$!%*?&])/, {
    message: '최소 하나 이상의 알파벳, 숫자, 특수문자를 포함해야 합니다.',
  })
  password: string;

  @IsNotEmpty({ message: '비밀번호 재입력은 필수 항목입니다.' })
  @IsString({ message: '비밀번호 재입력은 문자열 형태여야 합니다.' })
  confirmPassword: string;

  @IsNotEmpty({ message: '닉네임은 필수 항목입니다.' })
  @IsString({ message: '닉네임은 문자열 형태여야 합니다.' })
  @MinLength(2, { message: '닉네임은 2자 이상이어야 합니다.' })
  @MaxLength(30, { message: '닉네임은 30자 이하여야 합니다.' })
  @Matches(/^[a-zA-Z0-9가-힣]+$/, {
    message: '닉네임은 한글, 영어, 숫자만 포함할 수 있습니다.',
  })
  nickname: string;

  @IsOptional()
  @IsArray({ message: '술 카테고리는 배열 형태여야 합니다.' })
  @IsNumber(
    {},
    {
      each: true,
      message: '술 카테고리의 배열은 정수형만 포함할 수 있습니다.',
    },
  )
  alcoholCategory?: number[];

  @IsOptional()
  @IsArray({ message: '분위기 카테고리는 배열 형태여야 합니다.' })
  @IsNumber(
    {},
    {
      each: true,
      message: '분위기 카테고리의 배열은 정수형만 포함할 수 있습니다.',
    },
  )
  moodCategory?: number[];
}
