import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../errors';
import { StreamRepository } from '../repositories/stream.repository';
import { EventRepository } from '../repositories/event.repository';

export class WebhookService {
  private streamRepo: StreamRepository;
  private eventRepo: EventRepository;

  constructor(prisma: PrismaClient) {
    this.streamRepo = new StreamRepository(prisma);
    this.eventRepo = new EventRepository(prisma);
  }

  async captureWebhook(
    token: string,
    method: string,
    path: string,
    headers: Record<string, string | string[] | undefined>,
    rawBody: Buffer,
    sourceIp?: string
  ): Promise<{ id: string }> {
    const stream = await this.streamRepo.findByToken(token);
    if (!stream) {
      throw new NotFoundError('Stream not found');
    }

    // Normalize headers to string values (take first if array)
    const normalizedHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      if (value !== undefined) {
        normalizedHeaders[key] = Array.isArray(value) ? value[0] : value;
      }
    }

    const event = await this.eventRepo.create({
      streamId: stream.id,
      method,
      path,
      headers: normalizedHeaders,
      rawBody,
      sourceIp,
      contentLength: rawBody.length,
    });

    return { id: event.id };
  }
}
