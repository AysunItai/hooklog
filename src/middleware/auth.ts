import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { UnauthorizedError } from '../errors';
import { config } from '../config';
import { JwtPayload, RequestContext } from '../types';

// Store Prisma client reference for dev user creation
let prismaClient: PrismaClient | null = null;

export function setPrismaForAuth(prisma: PrismaClient): void {
  prismaClient = prisma;
}

// Ensure dev user exists and return its ID
async function ensureDevUser(): Promise<string> {
  if (!prismaClient) {
    throw new Error('Prisma client not initialized for auth middleware');
  }

  const devEmail = 'dev@hooklog.local';
  let user = await prismaClient.user.findUnique({
    where: { email: devEmail },
  });

  if (!user) {
    // Create dev user if it doesn't exist
    const hashedPassword = await bcrypt.hash('dev-password', 10);
    user = await prismaClient.user.create({
      data: {
        email: devEmail,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
  }

  return user.id;
}

async function authMiddlewareAsync(req: Request, res: Response, next: NextFunction): Promise<void> {
  // In development mode, bypass authentication and use a dev user
  if (config.nodeEnv === 'development') {
    if (!req.context) {
      req.context = { requestId: '' };
    }
    
    try {
      // Get or create dev user
      const devUserId = await ensureDevUser();
      req.context.userId = devUserId;
      req.context.userEmail = 'dev@hooklog.local';
      req.context.userRole = 'ADMIN' as any;
      return next();
    } catch (error) {
      console.error('Failed to ensure dev user:', error);
      return next(new UnauthorizedError('Failed to initialize dev user'));
    }
  }

  // Production mode - require authentication
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or invalid authorization header'));
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
      return next(new UnauthorizedError('Invalid token'));
    }
    return next(error);
  }
}

// Wrapper to handle async errors in Express
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  authMiddlewareAsync(req, res, next).catch(next);
}
