import { Inject, Injectable } from '@nestjs/common';
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
import { PrismaService } from 'src/common/modules/prisma.service';
import { OAuthUserDto } from './dtos/oauth-user.dto';
import { CheckEmailDto } from './dtos/check-email.dto';
import { CreateUserDto } from './dtos/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UserWithProfile } from './interfaces/user-with-profile.interface';
import { MailService } from './mail/mail.service';
import Redis from 'ioredis';
import { VerifyCodeDto } from './dtos/verify-code.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject('REDIS_CLIENT') private redis: Redis,
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.findUserByEmail(email);
    if (!user) {
      console.log('User not found');
      throw new UnauthorizedException();
    }

    // 비밀번호 비교
    // const isPasswordValid = await bcrypt.compare(password, user.hashPassword);
    const isPasswordValid = password === user.password ? 1 : 0;
    if (!isPasswordValid) {
      console.log('Invalid password');
      throw new UnauthorizedException();
    }

    return user;
  }

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

  async registerEmailUser(
    verifyCodeDto: VerifyCodeDto,
  ): Promise<UserWithProfile> {
    const { email, code } = verifyCodeDto;
    const isVerified = await this.verifyCode(email, code);

    if (!isVerified) {
      throw new BadRequestException('잘못된 코드를 입력하였습니다.');
    }

    const { password, nickname } = await this.getTempNewUser(email);
    return await this.createUser(email, password, 'local', nickname);
  }

  async checkEmailDuplicate(checkEmailDto: CheckEmailDto): Promise<boolean> {
    const { email } = checkEmailDto;
    const user = await this.findUserByEmail(email);

    return !!user;
  }

  generateVerificationCode(length: 6): string {
    const max = 10 ** length - 1;
    return Math.floor(Math.random() * max)
      .toString()
      .padStart(length, '0');
  }

  async saveNewUserInRedis(user: CreateUserDto, code: string): Promise<void> {
    const hasEnough = await this.enoughVerificationAttemp(user.email);
    if (!hasEnough) {
      throw new BadRequestException('인증 시도 횟수가 너무 많습니다.');
    }
    await this.setVerificationCode(user.email, code);
    await this.setTempNewUser(user);
  }

  async verifyCode(email: string, verificationCode: string): Promise<boolean> {
    const key = 'user:code:' + email;
    const code = await this.redis.get(key);

    await this.increaseVerificationAttemp(email);
    if (!code) {
      throw new UnauthorizedException();
    }

    return verificationCode === code;
  }

  async enoughVerificationAttemp(email: string): Promise<boolean> {
    const key = 'user:attemp:' + email;
    const attemp = Number(await this.redis.get(key));
    if (!attemp) {
      await this.redis.set(key, 0, 'EX', 86400);
    }

    return attemp < 10;
  }

  async increaseVerificationAttemp(email: string): Promise<void> {
    const key = 'user:attemp:' + email;
    const hasEnough = await this.enoughVerificationAttemp(email);
    if (!hasEnough) {
      throw new BadRequestException('인증 시도 횟수가 너무 많습니다.');
    }
    await this.redis.incr(key);
  }

  async setVerificationCode(email: string, code: string): Promise<void> {
    const key = 'user:code:' + email;
    await this.redis.set(key, code, 'EX', 600);
  }

  async setTempNewUser(user: CreateUserDto): Promise<void> {
    const key = 'user:register:' + user.email;
    const hash = await this.hashPassword(user.password);
    const data = {
      email: user.email,
      nickname: user.nickname,
      password: hash,
    };
    await this.redis.hset(key, data);
    await this.redis.expire(key, 600);
  }

  async getTempNewUser(email: string): Promise<CreateUserDto> {
    const key = 'user:register:' + email;
    const password = await this.redis.hget(key, 'password');
    const nickname = await this.redis.hget(key, 'nickname');
    if (!password || !nickname) {
      throw new BadRequestException();
    }

    const newUser: CreateUserDto = {
      email,
      password,
      nickname,
      confirmPassword: null,
    };

    return newUser;
  }

  async sendVerificationCodeToUser(
    createUserDto: CreateUserDto,
  ): Promise<void> {
    const { email, password, confirmPassword } = createUserDto;

    const user = await this.findUserByEmail(email);
    if (user) {
      throw new UnauthorizedException();
    }

    if (!this.comparePassword(password, confirmPassword)) {
      throw new UnauthorizedException();
    }

    const verificationCode = this.generateVerificationCode(6);
    await this.saveNewUserInRedis(createUserDto, verificationCode);
    await this.mailService.sendVerificationCode(email, verificationCode);
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

  async hashPassword(password: string): Promise<string> {
    const saltOfRounds = 10;
    return await bcrypt.hash(password, saltOfRounds);
  }

  comparePassword(password: string, confirmPassword: string): boolean {
    return password === confirmPassword;
  }
}
