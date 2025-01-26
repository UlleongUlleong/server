import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { MailService } from '../mail/mail.service';
import { UserPayload } from '../../common/interfaces/user-payload.interface';
import { LocalLoginDto } from './dtos/local-login.dto';
import { EmailDto } from '../mail/dtos/email.dto';
import { VerifyCodeDto } from '../mail/dtos/verify-code.dto';
import { PrismaService } from '../../common/modules/prisma/prisma.service';
import { User } from '@prisma/client';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private mailService: MailService,
    private userService: UserService,
    private prisma: PrismaService,
    private tokenService: TokenService,
  ) {}

  async isPasswordMatch(
    password: string,
    hashPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashPassword);
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
    const accessToken = await this.tokenService.createAccessToken(user.id);
    await this.tokenService.createRefreshToken(user.id, accessToken);

    return accessToken;
  }

  async hashPassword(password: string): Promise<string> {
    const saltOfRounds = 10;
    return await bcrypt.hash(password, saltOfRounds);
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

  async logout(token: string): Promise<void> {
    await this.tokenService.deleteToken(token);
    return;
  }
}
