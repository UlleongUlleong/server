import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { WsContent, WsResponse } from '../interfaces/ws-response.interface';
import { map, Observable } from 'rxjs';

@Injectable()
export class WsResponseInterceptor<T>
  implements NestInterceptor<T, WsResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<WsResponse<T>> {
    return next.handle().pipe(
      map((result: WsContent<T>) => {
        const wsResponse: WsResponse<T> = {
          event: result.event,
          data: {
            data: result.data || null,
            message: result.message || '요청이 성공적으로 처리되었습니다.',
          },
        };

        return wsResponse;
      }),
    );
  }
}
