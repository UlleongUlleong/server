import { IsEmail, IsString, IsNotEmpty, IsBoolean } from 'class-validator';

export class LocalLoginDto {
  @IsNotEmpty({ message: '이메일을 입력해 주세요' })
  @IsEmail({}, { message: '잘못된 형식입니다.' })
  readonly email: string;

  @IsNotEmpty({ message: '비밀번호를 입력해 주세요' })
  @IsString()
  readonly password: string;

  @IsBoolean()
  readonly isRemembered: boolean = false;
}
