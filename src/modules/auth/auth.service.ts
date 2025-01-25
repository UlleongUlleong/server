import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { MailService } from '../mail/mail.service';
import { UserPayload } from '../../common/interfaces/user-payload.interface';
import { OAuthUserDto } from './dtos/oauth-user.dto';
import { LocalLoginDto } from './dtos/local-login.dto';
import { generateRandomCode } from 'src/common/utils/random-generator.util';
import { EmailDto } from '../mail/dtos/email.dto';
import { VerifyCodeDto } from '../mail/dtos/verify-code.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject('REDIS_CLIENT') private redis: Redis,
    private jwtService: JwtService,
    private mailService: MailService,
    private userService: UserService,
  ) {}

  async isPasswordMatch(
    password: string,
    hashPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashPassword);
  }

  async createAccessToken(id: number): Promise<string> {
    return this.jwtService.sign({ sub: id }, { expiresIn: '1h' });
  }

  async createRefreshToken(id: number, accessToken: string): Promise<string> {
    const refreshToken = this.jwtService.sign({ sub: id }, { expiresIn: '7d' });
    const { exp } = this.jwtService.decode(refreshToken);
    const key = `refresh_token:users:${accessToken}`;

    await this.redis.set(key, refreshToken);
    await this.redis.expireat(key, exp);

    return;
  }

  async login(loginDto: LocalLoginDto): Promise<string> {
    const { email, password } = loginDto;
    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException('이메일 혹은 비밀번호가 다릅니다.');
    }
    if (user.providerId !== 1) {
      throw new ForbiddenException('간편 로그인으로 등록된 사용자입니다.');
    }
    const isPasswordMatch = await this.isPasswordMatch(password, user.password);
    if (!isPasswordMatch) {
      throw new UnauthorizedException('이메일 혹은 비밀번호가 다릅니다.');
    }

    await this.userService.restoreUser(user.id);
    const accessToken = await this.createAccessToken(user.id);
    await this.createRefreshToken(user.id, accessToken);

    return accessToken;
  }

  async createOAuthUser(oauthUserDto: OAuthUserDto): Promise<UserPayload> {
    const { email, provider, nickname } = oauthUserDto;

    return await this.userService.createUser(
      email,
      null,
      provider,
      nickname,
      [],
      [],
    );
  }

  async generateRandomNickname(): Promise<string> {
    const baseNickname = '만취멍';
    let nickname = baseNickname + generateRandomCode(8, 16);
    let attemptCount = 1;

    while (await this.userService.findProfileByNickname(nickname)) {
      nickname = baseNickname + generateRandomCode(8, 16);
      ++attemptCount;

      if (Number(attemptCount) >= 10) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: '랜덤 닉네임 시도가 너무 많아졌습니다.',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    return nickname;
  }

  async hashPassword(password: string): Promise<string> {
    const saltOfRounds = 10;
    return await bcrypt.hash(password, saltOfRounds);
  }

  async refreshAccessToken(token: string): Promise<string> {
    if (!token) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
    const payload: UserPayload = this.jwtService.decode(token);
    const id = payload.sub;
    const storedToken = await this.redis.get(`refresh_token:users:${token}`);
    if (!storedToken) {
      throw new UnauthorizedException('재로그인 해주세요');
    }
    const newToken = await this.createAccessToken(id);
    await this.createRefreshToken(id, newToken);
    await this.redis.del(token);
    return newToken;
  }

  async sendEmailCode(emailDto: EmailDto) {
    const { email } = emailDto;
    await this.mailService.sendCode(email);
  }

  async verifyEmailCode(verifyCodeDto: VerifyCodeDto) {
    const { email, code } = verifyCodeDto;
    await this.mailService.verifyCode(email, code);
  }

  async validateJwt(token: string): Promise<UserPayload> {
    const payload: UserPayload = await this.jwtService.verifyAsync(token);

    return payload;
  }

  async verifyToken(token: string): Promise<boolean> {
    try {
      await this.jwtService.verify(token);
      return true;
    } catch {
      return false;
    }
  }

  async decodeToken(token: string): Promise<UserPayload> {
    const user: UserPayload = await this.jwtService.decode(token);
    return user;
  }
}
