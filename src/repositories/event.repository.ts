import { PrismaClient, Event } from '@prisma/client';
import { PaginationCursor, PaginatedResponse } from '../types';
import { createPaginatedResponse, decodeCursor } from '../utils/pagination';
import { NotFoundError } from '../errors';

export interface EventFilters {
  streamId?: string;
  method?: string;
  startDate?: Date;
  endDate?: Date;
}

export class EventRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: {
    streamId: string;
    method: string;
    path: string;
    headers: Record<string, string>;
    rawBody: Buffer;
    sourceIp?: string;
    contentLength?: number;
  }): Promise<Event> {
    return this.prisma.event.create({
      data: {
        streamId: data.streamId,
        method: data.method,
        path: data.path,
        headers: data.headers,
        rawBody: data.rawBody,
        sourceIp: data.sourceIp,
        contentLength: data.contentLength,
      },
    });
  }

  async findById(id: string): Promise<Event | null> {
    return this.prisma.event.findUnique({
      where: { id },
      include: {
        stream: true,
      },
    });
  }

  async findMany(
    filters: EventFilters,
    limit: number,
    cursor?: string
  ): Promise<PaginatedResponse<Event & { stream: { id: string; token: string; name: string | null } }>> {
    const where: any = {};

    if (filters.streamId) {
      where.streamId = filters.streamId;
    }

    if (filters.method) {
      where.method = filters.method;
    }

    if (filters.startDate || filters.endDate) {
      where.receivedAt = {};
      if (filters.startDate) {
        where.receivedAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.receivedAt.lte = filters.endDate;
      }
    }

    if (cursor) {
      try {
        const decoded = decodeCursor(cursor);
        where.OR = [
          {
            receivedAt: {
              lt: new Date(decoded.receivedAt),
            },
          },
          {
            receivedAt: new Date(decoded.receivedAt),
            id: {
              lt: decoded.id,
            },
          },
        ];
      } catch (error) {
        // Invalid cursor, ignore it
      }
    }

    const events = await this.prisma.event.findMany({
      where,
      orderBy: [
        { receivedAt: 'desc' },
        { id: 'desc' },
      ],
      take: limit + 1, // Fetch one extra to check if there's more
      include: {
        stream: {
          select: {
            id: true,
            token: true,
            name: true,
          },
        },
      },
    });

    return createPaginatedResponse(events, limit);
  }

  async getByIdOrThrow(id: string): Promise<Event & { stream: any }> {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        stream: {
          select: {
            id: true,
            token: true,
            name: true,
          },
        },
      },
    });
    if (!event) {
      throw new NotFoundError('Event not found');
    }
    return event;
  }
}
