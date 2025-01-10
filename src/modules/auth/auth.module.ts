import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { GoogleStrategy } from './strategies/google.strategy';
import { NaverStrategy } from './strategies/naver.strategy';
import { KakaoStrategy } from './strategies/kakao.strategy';
import { PrismaService } from 'src/prisma.service';
import { MailService } from './mail/mail.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.ACCESS_JWT_KEY,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [
    AuthService,
    MailService,
    GoogleStrategy,
    NaverStrategy,
    KakaoStrategy,
    PrismaService,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
