import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  handleRequest(err, user, info, context: ExecutionContext) {
    if (err) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }

    const skipStatusCheck = this.reflector.get(
      'skipStatusCheck',
      context.getHandler(),
    );

    if (!skipStatusCheck && !user.isActive) {
      throw new ForbiddenException('비활성화된 사용자는 이용할 수 없습니다.');
    }

    return user;
  }
}
