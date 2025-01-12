import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LocalLoginDto } from './dtos/local-login.dto';
import { UserInfo } from './interfaces/userInfo.inerface';
import { ResponseLogin } from './interfaces/reponse-login.interface';
import {
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, User, Profile } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { OAuthUserDto } from './dtos/oauth-user.dto';
import { CheckEmailDto } from './dtos/check-email.dto';
import { CreateUserDto } from './dtos/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UserWithProfile } from './interfaces/user-with-profile.interface';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async findProfileByUid(userId: number): Promise<Profile | null> {
    return this.prisma.profile.findUnique({
      where: { userId: userId },
    });
  }

  async isPasswordMatch(
    password: string,
    hashPassword: string,
  ): Promise<boolean> {
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
    if (user && !(user.deletedAt === null)) {
      throw new ForbiddenException('탈퇴(비활성화)된 계정입니다.');
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

  async activateAccount(loginDto: LocalLoginDto): Promise<void> {
    await this.prisma.user.update({
      where: { email: loginDto.email },
      data: { deletedAt: null },
    });
  }

  async findUserByEmail(email: string): Promise<User> {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async registerOAuthUser(
    oauthUserDto: OAuthUserDto,
  ): Promise<UserWithProfile> {
    const { email, id, provider, nickname } = oauthUserDto;

    return await this.createUser(email, id, provider, nickname);
  }

  async checkEmailDuplicate(checkEmailDto: CheckEmailDto): Promise<boolean> {
    const { email } = checkEmailDto;
    const user = await this.findUserByEmail(email);

    return !!user;
  }

  async registerEmailUser(
    createUserDto: CreateUserDto,
  ): Promise<UserWithProfile> {
    const { email, password, nickname } = createUserDto;
    const provider = 'local';

    const user = await this.findUserByEmail(email);
    if (user) {
      throw new UnauthorizedException();
    }

    const saltOfRounds = 10;
    const hash = await bcrypt.hash(password, saltOfRounds);

    return await this.createUser(email, hash, provider, nickname);
  }

  async createUser(
    email: string,
    password: string,
    provider: string,
    nickname: string,
  ): Promise<UserWithProfile> {
    const newUser: Prisma.UserCreateInput = {
      email,
      password,
      provider: {
        connect: { name: provider },
      },
      profile: {
        create: {
          nickname,
        },
      },
    };

    const createdUserWithProfile = await this.prisma.$transaction(
      async (tx) => {
        const user = await tx.user.create({
          data: newUser,
          include: {
            provider: true,
            profile: true,
          },
        });

        return {
          id: user.id,
          provider: user.provider.name,
          nickname: user.profile.nickname,
          imageUrl: user.profile.imageUrl,
        };
      },
    );

    return createdUserWithProfile;
  }
}

// const hashedPassword = await bcrypt.hash(password, 10);
// console.log(hashedPassword);
