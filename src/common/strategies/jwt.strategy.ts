import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt'
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET_KEY,
    });
  }

  async validate(payload) {
    console.log(payload)
    if (await this.prisma.user.findUnique({where:{id: payload.id}})){
      return { userId: payload.id};
    }
    throw new UnauthorizedException('유효하지 않은 토큰')
  }
}
