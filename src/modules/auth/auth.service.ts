import {
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LocalLoginDto } from './dtos/local-login.dto';
import { UserInfo } from './interfaces/userInfo.inerface';
import { ResponseLogin } from './interfaces/reponse-login.interface';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Prisma, User, Profile } from '@prisma/client';
import { PrismaService } from 'src/common/modules/prisma.service';
import { OAuthUserDto } from './dtos/oauth-user.dto';
import { EmailDto } from './dtos/email.dto';
import * as bcrypt from 'bcrypt';
import { UserPayload } from './interfaces/user-payload.interface';
import { MailService } from './mail/mail.service';
import Redis from 'ioredis';
import { VerifyCodeDto } from './dtos/verify-code.dto';
import { NicknameDto } from './dtos/nickname.dto';
import { CreateUserDto } from './dtos/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject('REDIS_CLIENT') private redis: Redis,
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async isPasswordMatch(
    password: string,
    hashPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashPassword);
  }

  async createAccessToken(user: UserPayload): Promise<string> {
    return this.jwtService.sign(user, { expiresIn: '1h' });
  }

  async createRefreshToken(user: UserPayload): Promise<string> {
    const refreshToken = this.jwtService.sign(user, { expiresIn: '7d' });
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

    const userProfile = await this.findUserPayloadByEmail(user.email);
    const accessToken = await this.createAccessToken(userProfile);
    const refreshToken = await this.createRefreshToken(userProfile);

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

  async findProfileByNickname(nickname: string): Promise<Profile> {
    return await this.prisma.profile.findUnique({
      where: { nickname },
    });
  }

  async findUserPayloadByEmail(email: string): Promise<UserPayload> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        profile: {
          select: {
            nickname: true,
            imageUrl: true,
          },
        },
        provider: {
          select: {
            name: true,
          },
        },
      },
    });

    return user
      ? {
          id: user.id,
          nickname: user.profile.nickname,
          imageUrl: user.profile.imageUrl,
          provider: user.provider.name,
        }
      : null;
  }

  async registerOAuthUser(oauthUserDto: OAuthUserDto): Promise<UserPayload> {
    const { email, id, provider, nickname } = oauthUserDto;

    return await this.createUser(email, id, provider, nickname, [], []);
  }

  async registerEmailUser(createUserDto: CreateUserDto): Promise<void> {
    const {
      email,
      password,
      confirmPassword,
      nickname,
      alcoholCategory = [],
      moodCategory = [],
    } = createUserDto;

    if (!this.comparePassword(password, confirmPassword)) {
      throw new BadRequestException('입력한 비밀번호가 서로 다릅니다.');
    }

    await this.createUser(
      email,
      password,
      'local',
      nickname,
      alcoholCategory,
      moodCategory,
    );
  }

  async verifyEmailCode(verifyCodeDto: VerifyCodeDto): Promise<void> {
    const { email, code } = verifyCodeDto;

    const generatedCode = await this.checkEmailCodeExpiration(email);
    await this.checkAttemptCount(email);

    if (code !== generatedCode) {
      throw new BadRequestException('인증 코드가 일치하지 않습니다.');
    }
  }

  async checkEmailCodeExpiration(email: string): Promise<string> {
    const key = 'user:code:' + email;
    const code = await this.redis.get(key);

    if (!code) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: '인증 코드가 만료됐습니다.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    return code;
  }

  async checkEmailDuplication(emailDto: EmailDto): Promise<void> {
    const { email } = emailDto;
    const user = await this.findUserByEmail(email);

    if (user) {
      throw new ConflictException('이미 가입이 완료된 계정입니다.');
    }
  }

  async checkNicknameDuplication(nicknameDto: NicknameDto): Promise<void> {
    const { nickname } = nicknameDto;
    const profile = await this.findProfileByNickname(nickname);

    if (profile) {
      throw new ConflictException('이미 사용되고 있는 닉네임입니다.');
    }
  }

  generateRandomCode(length: number, base: number): string {
    if (base < 2 || base > 36) {
      throw new Error('진법은 2에서 36까지만 사용할 수 있습니다.');
    }
    const max = Math.pow(base, length);
    return Math.floor(Math.random() * max)
      .toString(base)
      .padStart(length, '0');
  }

  async generateRandomNickname(): Promise<string> {
    const baseNickname = '만취멍';
    let nickname = baseNickname + this.generateRandomCode(8, 16);
    let attemptCount = 1;

    while (await this.findProfileByNickname(nickname)) {
      nickname = baseNickname + this.generateRandomCode(8, 16);
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

  async saveEmailCode(email: string, code: string): Promise<void> {
    const userKey = 'user:code:' + email;
    await this.redis.set(userKey, code, 'EX', 600);

    const attemptKey = 'user:attempt:' + email;
    const attemptCount = await this.redis.get(attemptKey);
    if (!attemptCount) {
      await this.redis.set(attemptKey, '0', 'EX', 86400);
    }
  }

  async checkAttemptCount(email: string): Promise<number> {
    const key = 'user:attempt:' + email;
    const attemptCount = await this.redis.get(key);

    if (Number(attemptCount) >= 10) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: '인증코드 시도 횟수가 너무 많습니다.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return await this.redis.incr(key);
  }

  async sendEmailCode(emailDto: EmailDto): Promise<void> {
    const { email } = emailDto;

    const verificationCode = this.generateRandomCode(8, 16);
    console.log(verificationCode);
    await this.saveEmailCode(email, verificationCode);
    await this.mailService.sendCode(email, verificationCode);
  }

  async createUser(
    email: string,
    password: string,
    provider: string,
    nickname: string,
    alcoholCategory: number[],
    moodCategory: number[],
  ): Promise<UserPayload> {
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
      userAlcoholCategory: {
        create: alcoholCategory.map((id) => ({
          alcoholCategory: { connect: { id } },
        })),
      },
      userMoodCategory: {
        create: moodCategory.map((id) => ({
          moodCategory: { connect: { id } },
        })),
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
