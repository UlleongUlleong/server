import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-kakao';
import { AuthService } from '../auth.service';
import { OAuthUserDto } from '../dtos/oauth-user.dto';
import { UserPayload } from '../interfaces/user-payload.interface';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.OAUTH_KAKAO_ID,
      clientSecret: process.env.OAUTH_KAKAO_SECRET,
      callbackURL: process.env.OAUTH_KAKAO_REDIRECT,
      scope: ['profile_nickname', 'account_email', 'birthday', 'birthyear'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<UserPayload> {
    const id: string = profile.id.toString();
    const email: string = profile._json.kakao_account.email;
    const provider: string = profile.provider;
    const nickname: string = profile.username;

    const user: UserPayload =
      await this.authService.findUserPayloadByEmail(email);
    if (user) {
      return user;
    }

    const oauthUser: OAuthUserDto = {
      email,
      id,
      provider,
      nickname,
    };

    return await this.authService.registerOAuthUser(oauthUser);
  }
}
