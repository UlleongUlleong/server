import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { OAuthUserDto } from './dtos/oauth-user.dto';
import { CheckEmailDto } from './dtos/check-email.dto';
import { CreateUserDto } from './dtos/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UserWithProfile } from './interfaces/user-with-profile.interface';
import { MailService } from './mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
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

  async login(user: any) {
    const payload = { id: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
    };
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

  generateVerificationCode(length: 6): string {
    const max = 10 ** length - 1;
    return Math.floor(Math.random() * max)
      .toString()
      .padStart(length, '0');
  }

  async registerEmailUser(createUserDto: CreateUserDto): Promise<void> {
    const { email, password, confirmPassword, nickname } = createUserDto;
    const provider = 'local';

    const user = await this.findUserByEmail(email);
    if (user) {
      throw new UnauthorizedException();
    }

    if (!this.comparePassword(password, confirmPassword)) {
      throw new UnauthorizedException();
    }

    const verificationCode = this.generateVerificationCode(6);
    await this.mailService.sendVerificationCode(email, verificationCode);

    const hash = await this.hashPassword(password);
    // return await this.createUser(email, hash, provider, nickname);
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
