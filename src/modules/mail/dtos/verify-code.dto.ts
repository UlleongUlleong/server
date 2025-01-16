import { IsEmail, IsNotEmpty, IsNumberString, Length } from 'class-validator';

export class VerifyCodeDto {
  @IsNotEmpty({ message: '이메일은 필수 항목입니다.' })
  @IsEmail({}, { message: '이메일 형식이어야 합니다.' })
  email: string;

  @IsNotEmpty({ message: '인증 코드는 필수 항목입니다.' })
  @Length(6, 6, { message: '인증 코드는 6자리 문자열입니다.' })
  @IsNumberString({}, { message: '인증 코드는 숫자만 포함해야 합니다.' })
  code: string;
}
