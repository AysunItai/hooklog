import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../errors';
import { config } from '../config';
import { JwtPayload, RequestContext } from '../types';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid authorization header');
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    
    if (!req.context) {
      req.context = { requestId: '' };
    }
    
    req.context.userId = decoded.userId;
    req.context.userEmail = decoded.email;
    req.context.userRole = decoded.role;
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid token');
    }
    throw error;
  }
}
