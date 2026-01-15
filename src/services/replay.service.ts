import { PrismaClient } from '@prisma/client';
import { NotFoundError, SSRFError } from '../errors';
import { config } from '../config';
import { validateUrlForSSRF } from '../utils/ssrf';
import { EventRepository } from '../repositories/event.repository';
import { ReplayAttemptRepository } from '../repositories/replay.repository';
import { ReplayOptions, ReplayResult } from '../types';

export class ReplayService {
  private eventRepo: EventRepository;
  private replayRepo: ReplayAttemptRepository;

  constructor(prisma: PrismaClient) {
    this.eventRepo = new EventRepository(prisma);
    this.replayRepo = new ReplayAttemptRepository(prisma);
  }

  async replayEvent(
    eventId: string,
    options: ReplayOptions,
    attemptNumber: number = 1
  ): Promise<ReplayResult> {
    const event = await this.eventRepo.getByIdOrThrow(eventId);

    // SSRF protection
    await validateUrlForSSRF(options.targetUrl);

    const startTime = Date.now();
    let result: ReplayResult;

    try {
      result = await this.executeReplay(event, options);
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      result = {
        status: 'error',
        durationMs,
        errorMessage,
      };
    }

    // Persist attempt
    await this.replayRepo.create({
      eventId: event.id,
      targetUrl: options.targetUrl,
      attemptNumber,
      status: result.status,
      durationMs: result.durationMs,
      responseStatus: result.responseStatus,
      responseBody: result.responseBody,
      errorMessage: result.errorMessage,
    });

    // Retry logic
    if (result.status === 'error' && attemptNumber < config.replay.maxRetries) {
      // Exponential backoff: 1s, 2s, 4s
      const backoffMs = Math.pow(2, attemptNumber - 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, backoffMs));

      return this.replayEvent(eventId, options, attemptNumber + 1);
    }

    return result;
  }

  private async executeReplay(event: any, options: ReplayOptions): Promise<ReplayResult> {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.replay.timeoutMs);

    try {
      // Prepare headers
      const headers: Record<string, string> = { ...(event.headers as Record<string, string>) };
      if (options.overrideHeaders) {
        Object.assign(headers, options.overrideHeaders);
      }

      // Prepare body
      let body: Buffer;
      if (options.overrideBody) {
        // Check if it's base64 encoded
        try {
          body = Buffer.from(options.overrideBody, 'base64');
        } catch {
          body = Buffer.from(options.overrideBody, 'utf-8');
        }
      } else {
        body = event.rawBody as Buffer;
      }

      // Determine HTTP method
      const method = event.method || 'POST';

      // Make the request
      const response = await fetch(options.targetUrl, {
        method,
        headers,
        body: method !== 'GET' && method !== 'HEAD' ? body : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Read response body with size limit
      const maxSize = config.replay.maxResponseSizeKB * 1024;
      const responseBody = await this.readResponseWithLimit(response, maxSize);

      const durationMs = Date.now() - startTime;

      return {
        status: response.ok ? 'success' : 'error',
        durationMs,
        responseStatus: response.status,
        responseBody,
        errorMessage: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      const durationMs = Date.now() - startTime;

      if (error instanceof Error && error.name === 'AbortError') {
        return {
          status: 'timeout',
          durationMs,
          errorMessage: 'Request timeout',
        };
      }

      throw error;
    }
  }

  private async readResponseWithLimit(response: Response, maxSize: number): Promise<string> {
    const reader = response.body?.getReader();
    if (!reader) {
      return '';
    }

    const chunks: Uint8Array[] = [];
    let totalSize = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (totalSize + value.length > maxSize) {
          chunks.push(value.slice(0, maxSize - totalSize));
          totalSize = maxSize;
          break;
        }

        chunks.push(value);
        totalSize += value.length;
      }
    } finally {
      reader.releaseLock();
    }

    const buffer = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
    const text = buffer.toString('utf-8');

    if (totalSize >= maxSize) {
      return text + '\n... (truncated)';
    }

    return text;
  }
}
