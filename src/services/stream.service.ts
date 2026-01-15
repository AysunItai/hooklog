import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { StreamRepository } from '../repositories/stream.repository';

export class StreamService {
  private streamRepo: StreamRepository;

  constructor(prisma: PrismaClient) {
    this.streamRepo = new StreamRepository(prisma);
  }

  async createStream(userId: string, name?: string): Promise<{ id: string; token: string; name?: string }> {
    // Generate a cryptographically secure random token
    const token = this.generateToken();

    const stream = await this.streamRepo.create(userId, token, name);

    return {
      id: stream.id,
      token: stream.token,
      name: stream.name || undefined,
    };
  }

  async listStreams(userId: string): Promise<Array<{ id: string; token: string; name?: string; createdAt: Date }>> {
    const streams = await this.streamRepo.findByUserId(userId);

    return streams.map((s) => ({
      id: s.id,
      token: s.token,
      name: s.name || undefined,
      createdAt: s.createdAt,
    }));
  }

  private generateToken(): string {
    // Generate a 32-byte random token, base64url encoded (URL-safe)
    return crypto.randomBytes(32).toString('base64url');
  }
}
