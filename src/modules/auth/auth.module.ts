import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from './strategies/google.strategy';
import { NaverStrategy } from './strategies/naver.strategy';
import { KakaoStrategy } from './strategies/kakao.strategy';
import { MailService } from './mail/mail.service';
import { UserService } from '../user/user.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [
    AuthService,
    MailService,
    GoogleStrategy,
    NaverStrategy,
    KakaoStrategy,
    JwtStrategy,
    UserService,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
