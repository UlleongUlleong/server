import { IsNotEmpty, IsString, Max } from 'class-validator';

export class SendMessageDto {
  @IsNotEmpty({ message: '메시지는 필수 항목입니다.' })
  @IsString({ message: '메시지는 문자열 타입입니다.' })
  @Max(500, { message: '메시지의 최대 길이는 500자입니다.' })
  message: string;
}
