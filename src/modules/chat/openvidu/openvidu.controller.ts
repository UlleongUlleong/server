import { Controller, Post, Body } from '@nestjs/common';
import { OpenViduService } from './openvidu.service';
import { HttpContent } from 'src/common/interfaces/http-response.interface';
// import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CreateSession } from '../interfaces/create-session.interface';
import { CreateToken } from '../interfaces/create-token.interface';

@Controller('openvidu')
export class OpenViduController {
  constructor(private readonly openViduService: OpenViduService) {}

  // @UseGuards(JwtAuthGuard)
  @Post('session')
  async createSession(
    @Body('roomId') roomId: string,
  ): Promise<HttpContent<CreateSession>> {
    if (!roomId) {
      throw new Error('sessionId is required');
    }
    const sessionId = await this.openViduService.createSession(roomId);
    return {
      data: { sessionId: sessionId },
      message: '세션이 생성되었습니다.',
    };
  }

  // @UseGuards(JwtAuthGuard)
  @Post('token')
  async createToken(
    @Body('sessionId') sessionId: string,
  ): Promise<HttpContent<CreateToken>> {
    if (!sessionId) {
      throw new Error('sessionId is required');
    }
    const token = await this.openViduService.createToken(sessionId);
    return {
      data: { token: token },
      message: '토큰 생성',
    };
  }
}
