import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { EventController } from '../controllers/event.controller';
import { authMiddleware } from '../middleware/auth';

export function createEventRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const controller = new EventController(prisma);

  router.use(authMiddleware);

  router.get('/', controller.list.bind(controller));
  router.get('/:id', controller.getById.bind(controller));

  return router;
}
