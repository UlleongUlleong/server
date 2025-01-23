import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserPayload } from '../interfaces/user-payload.interface';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }

  handleRequest<TUser = UserPayload>(
    err: Error | null,
    user: TUser | null,
  ): TUser {
    if (err || !user) {
      throw new UnauthorizedException('사용자의 인증이 실패하였습니다.');
    }

    return user;
  }
}
