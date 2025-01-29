import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserPayload } from '../../common/interfaces/user-payload.interface';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {}

  async refreshAccessToken(
    token: string,
  ): Promise<{ newToken: string; maxAge: boolean }> {
    const refreshToken = await this.redis.hgetall(`refresh_token:for:${token}`);
    if (!refreshToken) {
      throw new UnauthorizedException('다시 로그인해주세요.');
    }

    const payload: UserPayload = this.jwtService.decode(token);
    const newToken = await this.createAccessToken(payload.sub);
    await this.createRefreshToken(payload.sub, newToken);
    await this.redis.del(`refresh_token:for:${token}`);
    let maxAge = false;
    if (refreshToken.isRemembered) {
      maxAge = true;
    }
    return { newToken, maxAge };
  }

  async createAccessToken(id: number): Promise<string> {
    return this.jwtService.sign({ sub: id }, { expiresIn: '1h' });
  }

  async createRefreshToken(
    id: number,
    accessToken: string,
    isRemembered?: boolean,
  ): Promise<void> {
    const refreshToken = this.jwtService.sign({ sub: id }, { expiresIn: '7d' });
    const { exp } = this.jwtService.decode(refreshToken);
    const key = `refresh_token:for:${accessToken}`;
    await this.redis.hset(
      key,
      'refreshToken',
      refreshToken,
      'isRemembered',
      isRemembered ? 1 : 0,
    );
    await this.redis.expireat(key, exp);
    return;
  }

  async deleteToken(token: string): Promise<void> {
    const key = `refresh_token:for:${token}`;
    await this.redis.del(key);
    return;
  }

  async isToken(token: string): Promise<boolean> {
    if (await this.redis.hexists(`refresh_token:for:${token}`, 'refeshToken')) {
      return true;
    }
    return false;
  }
}
