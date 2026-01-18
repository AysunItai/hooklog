import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth';

// Wrapper to catch async errors in route handlers
function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function createAuthRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const controller = new AuthController(prisma);

  router.post('/register', asyncHandler(controller.register.bind(controller)));
  router.post('/login', asyncHandler(controller.login.bind(controller)));
  router.get('/me', authMiddleware, asyncHandler(controller.me.bind(controller)));

  return router;
}
