import { Module } from '@nestjs/common';
import { AlcoholController } from './alcohol.controller';
import { AlcoholService } from './alcohol.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  providers: [AlcoholService],
  controllers: [AlcoholController],
  imports: [AuthModule],
})
export class AlcoholModule {}
