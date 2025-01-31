import { Controller, Post, Body } from '@nestjs/common';
import { OpenViduService } from './openvidu.service';
import { HttpContent } from 'src/common/interfaces/http-response.interface';

@Controller('openvidu')
export class OpenViduController {
  constructor(private readonly openViduService: OpenViduService) {}

  @Post('session')
  async createSession(
    @Body('sessionId') roomId: string,
    // @Headers('authorization') authorization: string,
  ): Promise<HttpContent<string>> {
    if (!roomId) {
      throw new Error('sessionId is required');
    }
    const sessionId = await this.openViduService.createSession(roomId);
    return {
      data: sessionId,
      message: '세션이 생성되었습니다.',
    };
  }

  @Post('token')
  async createToken(
    @Body('sessionId') sessionId: string,
  ): Promise<HttpContent<string>> {
    if (!sessionId) {
      throw new Error('sessionId is required');
    }
    console.log(sessionId);
    const token = await this.openViduService.createToken(sessionId);
    console.log(token);
    return {
      data: token,
      message: '토큰 생성',
    };
  }
}
