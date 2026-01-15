import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../../app';
import { prisma } from '../../db/client';
import jwt from 'jsonwebtoken';
import { config } from '../../config';

describe('Event Pagination', () => {
  let app: Express;
  let authToken: string;
  let testUserId: string;
  let testStreamId: string;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'pagination@example.com',
        password: 'hashedpassword',
      },
    });
    testUserId = user.id;

    // Generate auth token
    authToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwt.secret
    );

    // Create stream
    const stream = await prisma.stream.create({
      data: {
        userId: user.id,
        token: 'pagination-token',
      },
    });
    testStreamId = stream.id;

    // Create multiple events
    const events = [];
    for (let i = 0; i < 25; i++) {
      events.push({
        streamId: stream.id,
        method: 'POST',
        path: '/test',
        headers: {},
        rawBody: Buffer.from(`event-${i}`),
        receivedAt: new Date(Date.now() + i * 1000), // Stagger timestamps
      });
    }
    await prisma.event.createMany({ data: events });

    app = createApp(prisma);
  });

  afterAll(async () => {
    await prisma.event.deleteMany({ where: { streamId: testStreamId } });
    await prisma.stream.deleteMany({ where: { id: testStreamId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  it('should paginate events with cursor', async () => {
    const firstPage = await request(app)
      .get('/events')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ limit: 10 })
      .expect(200);

    expect(firstPage.body.data).toHaveLength(10);
    expect(firstPage.body.hasMore).toBe(true);
    expect(firstPage.body.nextCursor).toBeDefined();

    const secondPage = await request(app)
      .get('/events')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ limit: 10, cursor: firstPage.body.nextCursor })
      .expect(200);

    expect(secondPage.body.data).toHaveLength(10);
    expect(secondPage.body.data[0].id).not.toBe(firstPage.body.data[0].id);
  });

  it('should filter events by streamId', async () => {
    const response = await request(app)
      .get('/events')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ streamId: testStreamId, limit: 5 })
      .expect(200);

    expect(response.body.data.every((e: any) => e.streamId === testStreamId)).toBe(true);
  });
});
