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
        token = await this.authService.refreshAccessToken(token);
        const response = context.switchToHttp().getResponse();
        response.setHeader('Authorization', `Bearer ${token}`);
      }
      const user: UserPayload = await this.authService.decodeToken(token);
      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  }
}
