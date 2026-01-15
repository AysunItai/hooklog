import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { createAuthRoutes } from './auth.routes';
import { createWebhookRoutes } from './webhook.routes';
import { createEventRoutes } from './event.routes';
import { createReplayRoutes } from './replay.routes';
import { createStreamRoutes } from './stream.routes';

export function createRoutes(prisma: PrismaClient): Router {
  const router = Router();

  router.use('/auth', createAuthRoutes(prisma));
  router.use('/streams', createStreamRoutes(prisma));
  router.use('/events', createEventRoutes(prisma));
  router.use('/', createReplayRoutes(prisma));
  router.use('/', createWebhookRoutes(prisma));

  return router;
}
