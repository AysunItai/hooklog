import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorResponse } from '../errors';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = req.context?.requestId || 'unknown';

  if (err instanceof AppError) {
    const errorResponse: ErrorResponse = {
      error: {
        code: err.code || 'INTERNAL_ERROR',
        message: err.message,
        details: err.details,
        requestId,
      },
    };

    logger.warn(
      {
        requestId,
        statusCode: err.statusCode,
        code: err.code,
        message: err.message,
        path: req.path,
        method: req.method,
      },
      'Request error'
    );

    res.status(err.statusCode).json(errorResponse);
    return;
  }

  // Unexpected error
  logger.error(
    {
      requestId,
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    },
    'Unexpected error'
  );

  const errorResponse: ErrorResponse = {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      requestId,
    },
  };

  res.status(500).json(errorResponse);
}
