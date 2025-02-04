import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { OpenVidu, Session, Connection } from 'openvidu-node-client';

@Injectable()
export class OpenViduService {
  private readonly logger = new Logger(OpenViduService.name);
  private openvidu: OpenVidu;
  private sessions: Map<string, Session> = new Map();
  constructor() {
    const openviduUrl = process.env.OPENVIDU_URL;
    const openviduSecret = process.env.OPENVIDU_SECRET;

    if (!openviduUrl || !openviduSecret) {
      throw new Error('openvidu url, secret 오류');
    }
    this.openvidu = new OpenVidu(openviduUrl, openviduSecret);
  }

  async createSession(roomId: string): Promise<string> {
    if (this.sessions.has(roomId)) {
      return this.sessions.get(roomId).sessionId;
    }
    const session = await this.openvidu.createSession({
      customSessionId: roomId,
    });
    this.sessions.set(roomId, session);
    this.logger.log(`created session: ${session.sessionId}`);
    return session.sessionId;
  }

  async createToken(sessionId: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new BadRequestException('없는 세션');
    }
    const connection: Connection = await session.createConnection();
    this.logger.log(`created token ${sessionId}`);
    return connection.token;
  }
}
