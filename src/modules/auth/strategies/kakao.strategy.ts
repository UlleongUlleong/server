import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-kakao';
import { OAuthUserDto } from '../../user/dtos/oauth-user.dto';
import { UserService } from 'src/modules/user/user.service';
import { User } from '@prisma/client';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(private userService: UserService) {
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
  ): Promise<User> {
    const id: string = profile.id.toString();
    const email: string = profile._json.kakao_account.email;
    const provider: string = profile.provider;
    const nickname: string = await this.userService.generateRandomNickname();

    const user: User = await this.userService.findUserByEmail(email);
    if (user) {
      await this.userService.restoreUser(user.id);
      return user;
    }

    const oauthUser: OAuthUserDto = {
      email,
      id,
      provider,
      nickname,
    };

    return await this.userService.createOAuthUser(oauthUser);
  }
}
