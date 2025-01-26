import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { OAuthUserDto } from '../../user/dtos/oauth-user.dto';
import { UserService } from 'src/modules/user/user.service';
import { User } from '@prisma/client';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private userService: UserService) {
    super({
      clientID: process.env.OAUTH_GOOGLE_ID,
      clientSecret: process.env.OAUTH_GOOGLE_SECRET,
      callbackURL: process.env.OAUTH_GOOGLE_REDIRECT,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<User> {
    const id: string = profile._json.sub;
    const email: string = profile._json.email;
    const provider: string = profile.provider;

    const user: User = await this.userService.findUserByEmail(email);
    if (user) {
      await this.userService.restoreUser(user.id);
      return user;
    }

    const nickname: string = await this.userService.generateRandomNickname();
    const oauthUser: OAuthUserDto = {
      email,
      id,
      provider,
      nickname,
    };

    return await this.userService.createOAuthUser(oauthUser);
  }
}
