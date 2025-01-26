import { Module } from '@nestjs/common';
import { AlcoholController } from './alcohol.controller';
import { AlcoholService } from './alcohol.service';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from '../auth/token.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY,
    }),
  ],
  providers: [AlcoholService, TokenService],
  controllers: [AlcoholController],
})
export class AlcoholModule {}
