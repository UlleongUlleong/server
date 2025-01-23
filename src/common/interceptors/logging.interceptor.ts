import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const isHttp = context.getType() === 'http';
    const now = Date.now();

    if (isHttp) {
      const req = context.switchToHttp().getRequest();
      this.logger.log(
        `Http Request: ${req.method} ${req.url} - ${req.get('user-agent')} ${req.ip}`,
      );
    } else {
      const client = context.switchToWs().getClient();
      this.logger.log(`Ws Request: ${client}`);
    }

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - now + 'ms';
        if (isHttp) {
          const req = context.switchToHttp().getRequest();
          const res = context.switchToHttp().getResponse();
          this.logger.log(
            `Http Response: ${req.method} ${req.url} - ${res.statusCode} ${req.ip} +${duration}`,
          );
        } else {
          const client = context.switchToWs().getClient();
          this.logger.log(`Ws Response: ${client} +${duration}`);
        }
      }),
    );
  }
}
