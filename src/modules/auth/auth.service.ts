import {
  BadRequestException,
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
import { JwtToken } from './interfaces/jwt-token.interface';
import { UserPayload } from '../../common/interfaces/user-payload.interface';
import { OAuthUserDto } from './dtos/oauth-user.dto';
import { LocalLoginDto } from './dtos/local-login.dto';
import { generateRandomCode } from 'src/common/utils/random-generator.util';
import { EmailDto } from '../mail/dtos/email.dto';
import { VerifyCodeDto } from '../mail/dtos/verify-code.dto';
import { PrismaService } from '../../common/modules/prisma/prisma.service';
import { User } from '@prisma/client';
import { UpdatePasswordDto } from '../user/dtos/update-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject('REDIS_CLIENT') private redis: Redis,
    private jwtService: JwtService,
    private mailService: MailService,
    private userService: UserService,
    private prisma: PrismaService,
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

  async createRefreshToken(id: number): Promise<string> {
    const refreshToken = this.jwtService.sign({ sub: id }, { expiresIn: '7d' });
    const { exp } = this.jwtService.decode(refreshToken);
    const key = `refresh_token:users:${id}`;

    await this.redis.set(key, refreshToken);
    await this.redis.expireat(key, exp);

    return refreshToken;
  }

  async login(loginDto: LocalLoginDto): Promise<JwtToken> {
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
    const refreshToken = await this.createRefreshToken(user.id);

    return { accessToken, refreshToken };
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

  async refreshToken(token: string): Promise<JwtToken> {
    if (!token) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }

    const payload: UserPayload = this.jwtService.verify(token);
    const id = payload.sub;
    const storedToken = await this.redis.get(`refresh_token:users:${id}`);
    if (!storedToken) {
      throw new BadRequestException('토큰이 만료되었습니다.');
    }
    if (token !== storedToken) {
      throw new UnauthorizedException('토큰이 일치하지 않습니다.');
    }

    const accessToken = await this.createAccessToken(id);
    const refreshToken = await this.createRefreshToken(id);
    return { accessToken, refreshToken };
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

  async sendTemporaryPassword(emailDto: EmailDto): Promise<void> {
    const { email } = emailDto;
    const userInfo: User = await this.userService.findUserByEmail(email);
    if (userInfo.providerId !== 1) {
      throw new ForbiddenException('간편 로그인으로 등록된 사용자입니다.');
    }
    const temporaryPassword = await this.mailService.sendPassword(email);
    const hashPassword = await this.hashPassword(temporaryPassword);
    await this.updatePassword(email, hashPassword);
  }

  async updatePassword(email: string, password: string): Promise<void> {
    await this.prisma.user.update({
      where: { email: email },
      data: { password: password },
    });
  }

  async resetPassword(
    userId: number,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<void> {
    const { password, confirmPassword } = updatePasswordDto;
    const userInfo: User = await this.userService.findUserById(userId);
    if (userInfo.providerId !== 1) {
      throw new ForbiddenException('간편 로그인으로 등록된 사용자입니다.');
    }
    if (!this.userService.comparePassword(password, confirmPassword)) {
      throw new BadRequestException('입력한 비밀번호가 서로 다릅니다.');
    }
    const hashPassword = await this.hashPassword(password);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashPassword },
    });
  }
}
