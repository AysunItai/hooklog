import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { WebhookService } from '../services/webhook.service';

export class WebhookController {
  private webhookService: WebhookService;

  constructor(prisma: PrismaClient) {
    this.webhookService = new WebhookService(prisma);
  }

  async ingest(req: Request, res: Response): Promise<void> {
    const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
    const method = req.method;
    // Capture the original path (e.g., /i/token-value/path -> /i/token-value/path)
    // For this endpoint, path will be /i/:token, but we store the full original URL path
    const path = req.originalUrl.split('?')[0]; // Remove query string
    const headers = req.headers;
    const rawBody = req.rawBody || Buffer.alloc(0);
    const sourceIp = req.ip || req.socket.remoteAddress;

    const result = await this.webhookService.captureWebhook(
      token,
      method,
      path,
      headers,
      rawBody,
      sourceIp
    );

    res.status(201).json({ id: result.id });
  }
}
