import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException, Logger } from '@nestjs/common';
import { Response } from 'express';

interface ValidationDetail {
  message?: string;
  field?: string;
  constraints?: Record<string, string>;
}

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const details: ValidationDetail[] = [];

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resp = exceptionResponse as Record<string, unknown>;
      if (Array.isArray(resp.message)) {
        for (const msg of resp.message) {
          if (typeof msg === 'string') {
            details.push({ message: msg });
          } else if (typeof msg === 'object' && msg !== null) {
            const validationError = msg as {
              property?: string;
              constraints?: Record<string, string>;
            };
            details.push({
              field: validationError.property,
              constraints: validationError.constraints,
            });
          }
        }
      }
    }

    const errorResponse = {
      statusCode: status,
      error: 'Validation Failed',
      message: details.length > 0 ? 'Validation failed' : exception.message,
      details,
      timestamp: new Date().toISOString(),
    };

    this.logger.warn(`Validation error: ${JSON.stringify(details)}`);

    response.status(status).json(errorResponse);
  }
}
