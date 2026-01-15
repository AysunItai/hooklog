import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ReplayService } from '../services/replay.service';
import { ValidationError } from '../errors';
import { ReplayOptions } from '../types';
import { z } from 'zod';

const replaySchema = z.object({
  targetUrl: z.string().url(),
  overrideHeaders: z.record(z.string()).optional(),
  overrideBody: z.string().optional(),
});

export class ReplayController {
  private replayService: ReplayService;

  constructor(prisma: PrismaClient) {
    this.replayService = new ReplayService(prisma);
  }

  async replay(req: Request, res: Response): Promise<void> {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const parsed = replaySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid request body', parsed.error.errors);
    }

    const options: ReplayOptions = {
      targetUrl: parsed.data.targetUrl,
      overrideHeaders: parsed.data.overrideHeaders,
      overrideBody: parsed.data.overrideBody,
    };

    const result = await this.replayService.replayEvent(id, options);

    res.json({
      status: result.status,
      durationMs: result.durationMs,
      responseStatus: result.responseStatus,
      responseBody: result.responseBody,
      errorMessage: result.errorMessage,
    });
  }
}
