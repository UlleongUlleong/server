import { IsEmail, IsString, IsNotEmpty, IsBoolean } from 'class-validator';

export class LocalLoginDto {
  @IsNotEmpty({ message: '이메일을 입력해 주세요' })
  @IsEmail({}, { message: '잘못된 형식입니다.' })
  readonly email: string;

  @IsNotEmpty({ message: '비밀번호를 입력해 주세요' })
  @IsString()
  readonly password: string;

  @IsBoolean({ message: '자동로그인 여부는 필수입니다.' })
  readonly isRemembered: boolean = false;
}
