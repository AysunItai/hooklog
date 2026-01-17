import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ReplayController } from '../controllers/replay.controller';
import { authMiddleware } from '../middleware/auth';

export function createReplayRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const controller = new ReplayController(prisma);

  // Apply auth middleware only to the replay route
  router.post('/events/:id/replay', authMiddleware, controller.replay.bind(controller));

  return router;
}
