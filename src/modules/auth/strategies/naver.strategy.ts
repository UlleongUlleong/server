import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-naver';
import { AuthService } from '../auth.service';
import { OAuthUserDto } from '../dtos/oauth-user.dto';
import { UserPayload } from '../../../common/interfaces/user-payload.interface';
import { UserService } from 'src/modules/user/user.service';
import { User } from '@prisma/client';

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
  private authService: AuthService;
  private userService: UserService;

  constructor() {
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
    const nickname: string = await this.authService.generateRandomNickname();

    const user: User = await this.userService.findUserByEmail(email);
    if (user) {
      await this.userService.restoreUser(user.id);
      return {
        sub: user.id,
      };
    }

    const oauthUser: OAuthUserDto = {
      email,
      id,
      provider,
      nickname,
    };

    return await this.authService.createOAuthUser(oauthUser);
  }
}
