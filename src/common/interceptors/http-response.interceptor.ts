import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import {
  HttpResponse,
  HttpContent,
} from '../interfaces/http-response.interface';

@Injectable()
export class HttpResponseInterceptor<T>
  implements NestInterceptor<T, HttpResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<HttpResponse<T>> {
    const response = context.switchToHttp().getResponse();
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      map((result: HttpContent<T>) => {
        if (response.headersSent) {
          return;
        }

        const apiResponse: HttpResponse<T> = {
          statusCode: response.statusCode || 200,
          message: result.message || '요청이 성공적으로 처리되었습니다.',
          data: result.data || null,
          path: request.url,
        };

        if (result?.pagination) {
          apiResponse.pagination = result.pagination;
        }

        return apiResponse;
      }),
    );
  }
}
