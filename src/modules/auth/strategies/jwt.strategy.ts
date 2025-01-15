import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { UserPayload } from '../../../common/interfaces/user-payload.interface';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET_KEY,
    });
  }

  async validate(payload: UserPayload) {
    const user = await this.authService.findUserPayloadById(payload.id);
    if (!user) {
      throw new UnauthorizedException('사용자 인증이 실패했습니다.');
    }

    return user;
  }
}
