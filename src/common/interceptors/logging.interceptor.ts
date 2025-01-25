import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Socket } from 'socket.io';
import { parse } from 'url';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const isHttp = context.getType() === 'http';
    const now = Date.now();

    if (isHttp) {
      const req = context.switchToHttp().getRequest();
      this.logger.log(
        `Http Request: [${req.method}] ${parse(req.url, true).pathname} - ${req.get('user-agent')} [${req.ip}]`,
      );
    } else {
      const client = context.switchToWs().getClient<Socket>();
      this.logger.log(
        `Socket Message: ${client.id} [${client.handshake.address}]`,
      );
    }

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - now + 'ms';
        if (isHttp) {
          const req = context.switchToHttp().getRequest();
          const res = context.switchToHttp().getResponse();
          this.logger.log(
            `Http Response: [${req.method}] ${parse(req.url, true).pathname} - ${res.statusCode} [${req.ip}] +${duration}`,
          );
        } else {
          const client = context.switchToWs().getClient<Socket>();
          this.logger.log(
            `Socket Response: ${client.id} [${client.handshake.address}] +${duration}`,
          );
        }
      }),
    );
  }
}
