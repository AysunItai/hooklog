import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { StreamService } from '../services/stream.service';
import { ValidationError } from '../errors';
import { z } from 'zod';

const createStreamSchema = z.object({
  name: z.string().optional(),
});

export class StreamController {
  private streamService: StreamService;

  constructor(prisma: PrismaClient) {
    this.streamService = new StreamService(prisma);
  }

  async create(req: Request, res: Response): Promise<void> {
    const userId = req.context?.userId;
    if (!userId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }

    const parsed = createStreamSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid request body', parsed.error.errors);
    }

    const result = await this.streamService.createStream(userId, parsed.data.name);

    res.status(201).json(result);
  }

  async list(req: Request, res: Response): Promise<void> {
    const userId = req.context?.userId;
    if (!userId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }

    const streams = await this.streamService.listStreams(userId);

    res.json({ data: streams });
  }
}
