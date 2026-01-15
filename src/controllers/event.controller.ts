import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { EventRepository, EventFilters } from '../repositories/event.repository';
import { ValidationError } from '../errors';
import { z } from 'zod';

const eventListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
  streamId: z.string().optional(),
  method: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export class EventController {
  private eventRepo: EventRepository;

  constructor(prisma: PrismaClient) {
    this.eventRepo = new EventRepository(prisma);
  }

  async list(req: Request, res: Response): Promise<void> {
    const parsed = eventListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ValidationError('Invalid query parameters', parsed.error.errors);
    }

    const { cursor, limit = 20, streamId, method, startDate, endDate } = parsed.data;

    const filters: EventFilters = {};
    if (streamId) filters.streamId = streamId;
    if (method) filters.method = method;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const result = await this.eventRepo.findMany(filters, limit, cursor);

    // Convert rawBody to base64 for JSON response
    const events = result.data.map((event) => ({
      id: event.id,
      streamId: event.streamId,
      stream: event.stream,
      method: event.method,
      path: event.path,
      headers: event.headers,
      rawBody: (event.rawBody as Buffer).toString('base64'),
      sourceIp: event.sourceIp,
      contentLength: event.contentLength,
      receivedAt: event.receivedAt,
    }));

    res.json({
      data: events,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const event = await this.eventRepo.getByIdOrThrow(id);

    res.json({
      id: event.id,
      streamId: event.streamId,
      stream: event.stream,
      method: event.method,
      path: event.path,
      headers: event.headers,
      rawBody: (event.rawBody as Buffer).toString('base64'),
      sourceIp: event.sourceIp,
      contentLength: event.contentLength,
      receivedAt: event.receivedAt,
    });
  }
}
