import { PrismaClient, ReplayAttempt } from '@prisma/client';

export class ReplayAttemptRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: {
    eventId: string;
    targetUrl: string;
    attemptNumber: number;
    status: string;
    durationMs?: number;
    responseStatus?: number;
    responseBody?: string;
    errorMessage?: string;
  }): Promise<ReplayAttempt> {
    return this.prisma.replayAttempt.create({
      data,
    });
  }

  async findByEventId(eventId: string): Promise<ReplayAttempt[]> {
    return this.prisma.replayAttempt.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
