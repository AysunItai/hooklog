import { Request, Response, NextFunction } from 'express';
import { PayloadTooLargeError } from '../errors';
import { config } from '../config';

const MAX_SIZE = config.webhook.maxRequestSizeKB * 1024;

export function rawBodyMiddleware(req: Request, res: Response, next: NextFunction): void {
  const chunks: Buffer[] = [];
  let totalSize = 0;

  req.on('data', (chunk: Buffer) => {
    totalSize += chunk.length;
    if (totalSize > MAX_SIZE) {
      req.destroy();
      return next(new PayloadTooLargeError(`Request body exceeds ${config.webhook.maxRequestSizeKB}KB limit`));
    }
    chunks.push(chunk);
  });

  req.on('end', () => {
    req.rawBody = Buffer.concat(chunks);
    next();
  });

  req.on('error', (err) => {
    next(err);
  });
}
