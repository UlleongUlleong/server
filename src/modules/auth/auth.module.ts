import { Module } from '@nestjs/common';
import { GoogleStrategy } from './strategies/google.strategy';
import { NaverStrategy } from './strategies/naver.strategy';
import { AuthController } from './auth.controller';
import { KakaoStrategy } from './strategies/kakao.strategy';

@Module({
  controllers: [AuthController],
  providers: [GoogleStrategy, NaverStrategy, KakaoStrategy],
})
export class AuthModule {}
