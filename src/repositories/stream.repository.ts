import { PrismaClient, Stream } from '@prisma/client';
import { NotFoundError } from '../errors';

export class StreamRepository {
  constructor(private prisma: PrismaClient) {}

  async findByToken(token: string): Promise<Stream | null> {
    return this.prisma.stream.findUnique({
      where: { token },
    });
  }

  async findById(id: string): Promise<Stream | null> {
    return this.prisma.stream.findUnique({
      where: { id },
    });
  }

  async findByUserId(userId: string): Promise<Stream[]> {
    return this.prisma.stream.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, token: string, name?: string): Promise<Stream> {
    return this.prisma.stream.create({
      data: {
        userId,
        token,
        name,
      },
    });
  }

  async getByIdOrThrow(id: string): Promise<Stream> {
    const stream = await this.findById(id);
    if (!stream) {
      throw new NotFoundError('Stream not found');
    }
    return stream;
  }

  async getByTokenOrThrow(token: string): Promise<Stream> {
    const stream = await this.findByToken(token);
    if (!stream) {
      throw new NotFoundError('Stream not found');
    }
    return stream;
  }
}
