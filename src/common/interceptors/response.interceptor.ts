import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import {
  ApiResponse,
  CustomResponse,
} from '../interfaces/api-response.interface';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse();
    const isHttp = context.getType() === 'http';

    return next.handle().pipe(
      map((result: CustomResponse<T>) => {
        const apiResponse: ApiResponse<T> = {
          statusCode: response.statusCode || 200,
          message: result.message || '요청이 성공적으로 처리되었습니다.',
          data: result.data || null,
        };

        if (result?.pagination) {
          apiResponse.pagination = result.pagination;
        }

        if (isHttp) {
          const request = context.switchToHttp().getRequest();
          apiResponse['path'] = request.url;
        }

        return apiResponse;
      }),
    );
  }
}
