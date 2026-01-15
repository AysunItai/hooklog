import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { StreamController } from '../controllers/stream.controller';
import { authMiddleware } from '../middleware/auth';

export function createStreamRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const controller = new StreamController(prisma);

  router.use(authMiddleware);

  router.post('/', controller.create.bind(controller));
  router.get('/', controller.list.bind(controller));

  return router;
}
