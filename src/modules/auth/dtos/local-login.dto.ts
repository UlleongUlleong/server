import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class LocalLoginDto {
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @IsNotEmpty()
  @IsString()
  readonly password: string;
}
