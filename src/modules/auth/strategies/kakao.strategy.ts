import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-kakao';
import { AuthService } from '../auth.service';
import { User } from '@prisma/client';
import { OAuthUserDto } from '../dtos/oauth-user.dto';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.OAUTH_KAKAO_ID,
      clientSecret: process.env.OAUTH_KAKAO_SECRET,
      callbackURL: process.env.OAUTH_KAKAO_REDIRECT,
      scope: ['profile_nickname', 'profile_image', 'account_email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<void> {
    const id: string = profile.id.toString();
    const email: string = profile._json.kakao_account.email;
    const provider: string = profile.provider;
    const nickname: string = profile.username;

    const user: User = await this.authService.findUserByEmail(email);
    if (user) {
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
