import { PrismaClient } from '@prisma/client';
import { UserRepository } from './user.repository';
import { StreamRepository } from './stream.repository';
import { EventRepository } from './event.repository';
import { ReplayAttemptRepository } from './replay.repository';

export class Repositories {
  public user: UserRepository;
  public stream: StreamRepository;
  public event: EventRepository;
  public replayAttempt: ReplayAttemptRepository;

  constructor(prisma: PrismaClient) {
    this.user = new UserRepository(prisma);
    this.stream = new StreamRepository(prisma);
    this.event = new EventRepository(prisma);
    this.replayAttempt = new ReplayAttemptRepository(prisma);
  }
}
