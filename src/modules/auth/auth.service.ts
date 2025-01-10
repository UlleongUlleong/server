import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { OAuthUserDto } from './dtos/oauth-user.dto';
import { CheckEmailDto } from './dtos/check-email.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
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

  async registerOAuthUser(oauthUserDto: OAuthUserDto): Promise<void> {
    const newUser: Prisma.UserCreateInput = {
      email: oauthUserDto.email,
      password: oauthUserDto.id,
      provider: {
        connect: { name: oauthUserDto.provider },
      },
      profile: {
        create: {
          nickname: oauthUserDto.nickname,
        },
      },
    };

    const result = await this.prisma.$transaction(async (tx) => {
      const user: User = await tx.user.create({
        data: newUser,
      });

      return user;
    });

    console.log(result);
  }

  async checkEmailDuplicate(checkEmailDto: CheckEmailDto): Promise<boolean> {
    const { email } = checkEmailDto;
    const user = await this.findUserByEmail(email);

    return !!user;
  }
}
