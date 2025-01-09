import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[@$!%*?&])/, {
    message: '최소 하나 이상의 알파벳, 숫자, 특수문자를 포함해야 합니다.',
  })
  password: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(10)
  nickname: string;
}
