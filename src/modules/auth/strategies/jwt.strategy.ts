import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { UserPayload } from '../../../common/interfaces/user-payload.interface';
import { UserService } from 'src/modules/user/user.service';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET_KEY,
      passReqToCallback: true,
    });
  }
  async validate(req: Request, payload: UserPayload) {
    const user = await this.userService.findUserById(payload.sub);
    if (!user || user.deletedAt !== null) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }
    if (req.url !== '/api/users/me/status' && !user.isActive) {
      throw new ForbiddenException('비활성화된 사용자는 이용할 수 없습니다.');
    }
    return payload;
  }
}
