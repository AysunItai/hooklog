import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth';

export function createAuthRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const controller = new AuthController(prisma);

  router.post('/register', controller.register.bind(controller));
  router.post('/login', controller.login.bind(controller));
  router.get('/me', authMiddleware, controller.me.bind(controller));

  return router;
}
