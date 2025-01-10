import { IsEmail, IsNotEmpty } from 'class-validator';

export class CheckEmailDto {
  @IsNotEmpty({ message: '이메일은 비워둘 수 없습니다.' })
  @IsEmail({}, { message: '이메일 형식을 입력해야 합니다.' })
  email: string;
}
