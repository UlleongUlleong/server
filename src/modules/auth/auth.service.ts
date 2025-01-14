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
import { CheckEmailDto } from './dtos/check-email.dto';
import { CreateUserDto } from './dtos/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UserPayload } from './interfaces/user-payload.interface';
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

  async createAccessToken(user: UserPayload): Promise<string> {
    return this.jwtService.sign(user, { expiresIn: '1h' });
  }

  async createRefreshToken(user: UserPayload): Promise<string> {
    const refreshToken = this.jwtService.sign(user, { expiresIn: '7d' });
    const { exp } = this.jwtService.decode(refreshToken);
    const key = `${user.id}`;
    let info = await this.redis.get(key);
    if (info) {
      await this.redis.del(key);
    }
    await this.redis.set(key, refreshToken);
    await this.redis.expire(key, exp);
    info = await this.redis.get(key);
    return refreshToken;
  }

  async login(loginDto: LocalLoginDto): Promise<ResponseLogin> {
    const { email, password } = loginDto;

    const user = await this.findUserByEmail(email);
    if (user && !(user.deletedAt === null)) {
      throw new ForbiddenException('탈퇴(비활성화)된 계정입니다.');
    }
    if (!user || !(await this.isPasswordMatch(password, user.password))) {
      throw new BadRequestException('이메일 비밀번호를 다시 확인해 주세요');
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

  async registerEmailUser(verifyCodeDto: VerifyCodeDto): Promise<UserPayload> {
    const { email, code } = verifyCodeDto;
    const isVerified = await this.verifyCode(email, code);

    if (!isVerified) {
      throw new BadRequestException('잘못된 코드를 입력하였습니다.');
    }

    const { password, nickname, alcoholCategory, moodCategory } =
      await this.getTempNewUser(email);

    return await this.createUser(
      email,
      password,
      'local',
      nickname,
      alcoholCategory,
      moodCategory,
    );
  }

  async checkEmailDuplicate(checkEmailDto: CheckEmailDto): Promise<boolean> {
    const { email } = checkEmailDto;
    const user = await this.findUserPayloadByEmail(email);

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
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: '인증코드 시도 횟수가 너무 많습니다.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    await this.setVerificationCode(user.email, code);
    await this.setTempNewUser(user);
  }

  async verifyCode(email: string, verificationCode: string): Promise<boolean> {
    const key = 'user:code:' + email;
    const code = await this.redis.get(key);

    await this.increaseVerificationAttemp(email);
    if (!code) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: '인증 코드가 만료됐습니다.',
        },
        HttpStatus.NOT_FOUND,
      );
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
      alcoholCategory: user.alcoholCategory?.join(),
      moodCategory: user.moodCategory?.join(),
    };
    await this.redis.hset(key, data);
    await this.redis.expire(key, 600);
  }

  async getTempNewUser(email: string): Promise<CreateUserDto> {
    const key = 'user:register:' + email;
    const data = await this.redis.hgetall(key);
    if (!data) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: '회원가입 정보가 만료됐습니다.',
        },
        HttpStatus.NOT_FOUND,
      );
    }
    const user: CreateUserDto = {
      email: data.email,
      password: data.password,
      nickname: data.nickname,
      confirmPassword: undefined,
      alcoholCategory: data.alcoholCategory
        ? data.alcoholCategory.split(',').map(Number)
        : [],
      moodCategory: data.moodCategory
        ? data.moodCategory?.split(',').map(Number)
        : [],
    };

    return user;
  }

  async sendVerificationCodeToUser(
    createUserDto: CreateUserDto,
  ): Promise<void> {
    const { email, password, confirmPassword } = createUserDto;

    const user = await this.findUserPayloadByEmail(email);
    if (user) {
      throw new ConflictException('해당 이메일의 계정이 이미 존재합니다.');
    }

    if (!this.comparePassword(password, confirmPassword)) {
      throw new BadRequestException('비밀번호가 일치하지 않습니다.');
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

  async refresh(token: string) {
    const payload = this.jwtService.decode(token);
    const boo = await this.redis.get(payload.id);
    if (!token || !boo) {
      throw new BadRequestException('재로그인 해주세요');
    }
    delete payload.iat;
    delete payload.exp;
    const accessToken = await this.createAccessToken(payload);
    const refreshToken = await this.createRefreshToken(payload);
    return { accessToken, refreshToken };
  }
}

// const hashedPassword = await bcrypt.hash(password, 10);
// console.log(hashedPassword);
