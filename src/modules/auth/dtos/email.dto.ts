import { IsEmail, IsNotEmpty } from 'class-validator';

export class EmailDto {
  @IsNotEmpty({ message: '이메일은 필수 항목입니다.' })
  @IsEmail({}, { message: '이메일 형식으로 입력해야 합니다.' })
  email: string;
}
