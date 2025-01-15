import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { UserPayload } from '../../../common/interfaces/user-payload.interface';
import { AuthService } from '../auth.service';
import { UserService } from 'src/modules/user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET_KEY,
    });
  }

  async validate(payload: UserPayload) {
    const user = await this.userService.findUserById(payload.id);
    if (!user || user.deletedAt !== null) {
      throw new Error();
    }

    const userPayload = await this.authService.findUserPayloadById(payload.id);
    return userPayload;
  }
}
