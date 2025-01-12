import {
  IsEmail,
  IsNotEmpty,
  IsNumberString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class VerifyCodeDto {
  @IsNotEmpty()
  @IsEmail({}, { message: '이메일 형식이어야 합니다.' })
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(6)
  @IsNumberString({}, { message: '6자리 숫자 문자열 입력해야 합니다.' })
  code: string;
}
