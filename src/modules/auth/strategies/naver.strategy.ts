import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-naver';
import { AuthService } from '../auth.service';
import { OAuthUserDto } from '../dtos/oauth-user.dto';
import { UserPayload } from '../interfaces/user-payload.interface';

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
  ): Promise<UserPayload> {
    const id: string = profile.id;
    const email: string = profile._json.email;
    const provider: string = profile.provider;
    const nickname: string = profile._json.nickname;

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
