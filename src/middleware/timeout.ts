import { Request, Response, NextFunction } from 'express';
import { TimeoutError } from '../errors';
import { config } from '../config';

export function timeoutMiddleware(req: Request, res: Response, next: NextFunction): void {
  const timeout = config.webhook.requestTimeoutMs;
  const timer = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({
        error: {
          code: 'TIMEOUT',
          message: 'Request timeout',
        },
      });
    }
  }, timeout);

  res.on('finish', () => {
    clearTimeout(timer);
  });

  next();
}
