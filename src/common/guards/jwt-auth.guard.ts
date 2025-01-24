// import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';
// import { UserPayload } from '../interfaces/user-payload.interface';

// @Injectable()
// export class JwtAuthGuard extends AuthGuard('jwt') {
//   constructor() {
//     super();
//   }

//   handleRequest<TUser = UserPayload>(
//     err: Error | null,
//     user: TUser | null,
//     info: any,
//   ): TUser {
//     if (info?.name === 'TokenExpiredError') {
//       throw new UnauthorizedException({
//         message: 'TOKEN_EXPIRED',
//       });
//     }

//     if (err || !user) {
//       throw new UnauthorizedException('사용자의 인증이 실패하였습니다.');
//     }

//     return user;
//   }
// }

import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from 'src/modules/auth/auth.service';
import { UserPayload } from '../interfaces/user-payload.interface';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<any> {
    const request: Request = context.switchToHttp().getRequest();
    let token = request.headers['authorization'].split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('엑세스 토큰이 필요합니다.');
    }
    try {
      if (!(await this.authService.verifyToken(token))) {
        console.log(11);
        token = await this.authService.refreshAccessToken(token);
        const response = context.switchToHttp().getResponse();
        response.setHeader('Authorization', `Bearer ${token}`);
      }
      const user: UserPayload = await this.authService.decodeToken(token);
      console.log(1, user);
      request.user = user;
      return true;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  }
}
