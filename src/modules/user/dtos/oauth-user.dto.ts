import { IsEmail, IsIn, IsNotEmpty, IsString } from 'class-validator';

export class OAuthUserDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsIn(['google', 'naver', 'kakao'])
  provider: string;

  @IsNotEmpty()
  @IsString()
  nickname: string;
}
