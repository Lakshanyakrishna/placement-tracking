import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class QueryFailedFilter implements ExceptionFilter {
  private readonly logger = new Logger(QueryFailedFilter.name);

  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const driverError = exception.driverError as { code?: string };

    this.logger.error(`Database query failed: ${exception.message}`);

    if (driverError?.code === '23505') {
      const errorResponse = {
        statusCode: 409,
        error: 'Conflict',
        message: 'A record with the same unique value already exists',
        timestamp: new Date().toISOString(),
      };
      return response.status(409).json(errorResponse);
    }

    if (driverError?.code === '23503') {
      const errorResponse = {
        statusCode: 422,
        error: 'Unprocessable Entity',
        message: 'Referenced record does not exist',
        timestamp: new Date().toISOString(),
      };
      return response.status(422).json(errorResponse);
    }

    const errorResponse = {
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'A database error occurred',
      timestamp: new Date().toISOString(),
    };

    response.status(500).json(errorResponse);
  }
}
