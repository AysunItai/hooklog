import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ReplayController } from '../controllers/replay.controller';
import { authMiddleware } from '../middleware/auth';

export function createReplayRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const controller = new ReplayController(prisma);

  router.use(authMiddleware);

  router.post('/events/:id/replay', controller.replay.bind(controller));

  return router;
}
