import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { Request, Response } from 'express';
import { HttpExceptionResponse } from '../interfaces/exception-response.interface';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const { method, originalUrl } = req;
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] =
      '서버에서 예기치 못한 오류가 발생했습니다.';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse =
        exception.getResponse() as HttpExceptionResponse;
      message = exceptionResponse.message || message;
      error = exceptionResponse.error || 'Bad Request';

      this.logger.error(`[${method}] ${originalUrl} - ${error}`);
    } else if (
      Array.isArray(exception) &&
      exception.every((error) => error instanceof ValidationError)
    ) {
      status = HttpStatus.BAD_REQUEST;
      message = this.combineValidationException(exception);
      error = 'Validation Error';

      this.logger.error(`[${method}] ${originalUrl} - ${error}`);
    } else {
      this.logger.error(`[${method}] ${originalUrl} - ${exception.stack}`);
    }

    res.status(status).json({
      statusCode: status,
      error,
      message,
      path: originalUrl,
    });
  }

  combineValidationException(exception: ValidationError[]) {
    const message: string[] = [];
    const stack: ValidationError[] = [...exception];

    while (stack.length > 0) {
      const error = stack.pop();
      if (!error) continue;

      if (error.constraints) {
        message.push(...Object.values(error.constraints));
      }

      if (error.children && error.children.length > 0) {
        stack.push(...error.children);
      }
    }

    return message;
  }
}
