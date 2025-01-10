import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { User, Profile } from '@prisma/client';
import { LocalLoginDto } from './dtos/local-login.dto';
import { UserInfo } from './interfaces/userInfo.inerface';
import { ResponseLogin } from './interfaces/reponse-login.interface'

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email },
    });
  }

  async findProfileByUid(userId: number): Promise<Profile | null> {
    return this.prisma.profile.findUnique({
      where: { userId: userId },
    });
  }

  async isPasswordMatch(password: string, hashPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashPassword);
  }

  async createAccessToken(user: User): Promise<string> {
    const payload = {
      id: user.id,
    };
    return this.jwtService.sign(payload, { expiresIn: '1h' });
  }

  async createRefreshToken(user: User): Promise<string> {
    const payload = {
      id: user.id,
    };
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    const { exp } = this.jwtService.decode(refreshToken);

    await this.prisma.token.upsert({
      where: { userId: user.id },
      update: { refreshToken: refreshToken },
      create: { userId: user.id, refreshToken, expiresAt: exp },
    });

    return refreshToken;
  }

  async login(loginDto: LocalLoginDto): Promise<ResponseLogin> {
      const { email, password } = loginDto;
      const user = await this.findUserByEmail(email);
      if(user && !(user.deletedAt === null)) {
        throw new ForbiddenException('탈퇴(비활성화)된 계정입니다.')
      }
      if (!user || !(await this.isPasswordMatch(password, user.password))) {
        throw new BadRequestException('뭔가 틀렸으~');
      }

      const userProfile = await this.findProfileByUid(user.id);
      const accessToken = await this.createAccessToken(user);
      const refreshToken = await this.createRefreshToken(user);

      const userInfo: UserInfo = {
        id: user.id,
        email: user.email,
        nickname: userProfile.nickname,
        imageUrl: userProfile.imageUrl,
        refreshToken,
      };

      return { accessToken, userInfo };
  }

  async activateAccount(loginDto: LocalLoginDto): Promise<void>{
    //여기 이메일 인증로직 추가해야할 것같음
    await this.prisma.user.update({
      where: {email: loginDto.email},
      data: {deletedAt: null}
    })
  }
}