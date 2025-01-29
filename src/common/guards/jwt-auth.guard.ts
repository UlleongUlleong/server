import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { UserPayload } from '../interfaces/user-payload.interface';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../modules/prisma/prisma.service';
import { TokenService } from 'src/modules/auth/token.service';
import { checkNodeEnvIsProduction } from '../utils/environment.util';
import { SafeUser } from '../../modules/user/interfaces/safe-user.interface';

@Injectable()
export class JwtAuthGuard {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const token = request.cookies['access_token'];
    if (!token) {
      throw new UnauthorizedException('엑세스 토큰이 필요합니다.');
    }

    try {
      const payload: UserPayload = await this.jwtService.verify(token);
      const user: SafeUser = await this.findSafeUserById(payload.sub);

      request.user = user;

      return true;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        const { newToken, maxAge } =
          await this.tokenService.refreshAccessToken(token);

        const payload: UserPayload = await this.jwtService.decode(newToken);
        const user: SafeUser = await this.findSafeUserById(payload.sub);
        request.user = user;
        response.cookie('access_token', newToken, {
          httpOnly: true,
          secure: checkNodeEnvIsProduction(),
          sameSite: checkNodeEnvIsProduction() ? 'none' : 'lax',
          maxAge: maxAge ? 604799000 : null,
        });

        return true;
      }

      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  }

  async findSafeUserById(id: number): Promise<SafeUser> {
    const user: SafeUser = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        providerId: true,
        isActive: true,
        deletedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return user;
  }
}
