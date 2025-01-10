import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import { User } from '@prisma/client';
import { OAuthUserDto } from '../dtos/oauth-user.dto';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
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
  ): Promise<void> {
    const id: string = profile._json.sub;
    const email: string = profile._json.email;
    const provider: string = profile.provider;
    const nickname: string = profile._json.name;

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
