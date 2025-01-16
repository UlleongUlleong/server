import { Module } from '@nestjs/common';
import { AlcoholController } from './alcohol.controller';
import { AlcoholService } from './alcohol.service';

@Module({
  providers: [AlcoholService],
  controllers: [AlcoholController],
})
export class AlcoholModule {}
