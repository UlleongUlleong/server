import { Module } from '@nestjs/common';
import { OpenViduService } from './openvidu.service';
import { OpenViduController } from './openvidu.controller';

@Module({
  providers: [OpenViduService],
  controllers: [OpenViduController],
  exports: [OpenViduService],
})
export class OpenViduModule {}
