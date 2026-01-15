import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { WebhookController } from '../controllers/webhook.controller';
import { rawBodyMiddleware } from '../middleware/rawBody';
import { timeoutMiddleware } from '../middleware/timeout';

export function createWebhookRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const controller = new WebhookController(prisma);

  // Ingest endpoint - public, token-based
  router.post('/i/:token', timeoutMiddleware, rawBodyMiddleware, controller.ingest.bind(controller));

  return router;
}
