import { ArgumentsHost, Catch, HttpException, Logger } from '@nestjs/common';
import { HttpExceptionResponse } from '../interfaces/exception-response.interface';
import { Socket } from 'socket.io';
import { ValidationError } from 'class-validator';

@Catch()
export class WSExceptionFilter {
  private readonly logger = new Logger(WSExceptionFilter.name);

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToWs();
    const client = ctx.getClient<Socket>();
    const clientID = client.id;

    let message: string | string[] =
      '서버에서 예기치 못한 오류가 발생했습니다.';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      const exceptionResponse =
        exception.getResponse() as HttpExceptionResponse;
      message = exceptionResponse.message || message;
      error = exceptionResponse.error || 'Bad Request';

      this.logger.error(`ID: ${clientID} - ${error}`);
    } else if (
      Array.isArray(exception) &&
      exception.every((error) => error instanceof ValidationError)
    ) {
      message = this.combineValidationException(exception);
      error = 'Validation Error';

      this.logger.error(`ID: ${clientID} - ${error}`);
    } else {
      this.logger.error(`ID: ${clientID} - ${exception.stack}`);
    }

    client.emit('error', { message, error });
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
