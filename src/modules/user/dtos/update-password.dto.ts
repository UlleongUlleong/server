import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdatePasswordDto {
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
}
