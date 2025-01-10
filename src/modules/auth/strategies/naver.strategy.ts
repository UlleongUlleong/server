import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-naver';
import { AuthService } from '../auth.service';
import { User } from '@prisma/client';
import { OAuthUserDto } from '../dtos/oauth-user.dto';

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.OAUTH_NAVER_ID,
      clientSecret: process.env.OAUTH_NAVER_SECRET,
      callbackURL: process.env.OAUTH_NAVER_REDIRECT,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<void> {
    const id: string = profile.id;
    const email: string = profile._json.email;
    const provider: string = profile.provider;
    const nickname: string = profile._json.nickname;

    const user: User = await this.authService.findUserByEmail(email);
    if (user) {
      console.log('로그인 완료');
      return;
    }

    const oauthUser: OAuthUserDto = {
      email,
      id,
      provider,
      nickname,
    };

    await this.authService.registerOAuthUser(oauthUser);
  }
}
