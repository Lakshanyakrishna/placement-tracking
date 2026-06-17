import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & { requestId?: string }>();
    const { method, url } = request;
    const requestId = uuidv4();

    request.requestId = requestId;

    const now = Date.now();

    this.logger.log({
      requestId,
      message: `Incoming ${method} ${url}`,
      method,
      url,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          this.logger.log({
            requestId,
            message: `Response ${method} ${url} ${response.statusCode} ${Date.now() - now}ms`,
            statusCode: response.statusCode,
            duration: Date.now() - now,
          });
        },
        error: (error: Error & { status?: number }) => {
          this.logger.error({
            requestId,
            message: `Error ${method} ${url} - ${error.message}`,
            statusCode: error.status || 500,
            duration: Date.now() - now,
            error: error.message,
          });
        },
      }),
    );
  }
}
