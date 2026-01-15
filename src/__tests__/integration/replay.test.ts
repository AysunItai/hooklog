import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Express } from 'express';
import request from 'supertest';
import { createApp } from '../../app';
import { prisma } from '../../db/client';
import jwt from 'jsonwebtoken';
import { config } from '../../config';

describe('Replay with SSRF Protection', () => {
  let app: Express;
  let authToken: string;
  let testUserId: string;
  let testStreamId: string;
  let testEventId: string;

  beforeAll(async () => {

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'replay@example.com',
        password: 'hashedpassword',
      },
    });
    testUserId = user.id;

    authToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwt.secret
    );

    // Create stream and event
    const stream = await prisma.stream.create({
      data: {
        userId: user.id,
        token: 'replay-token',
      },
    });
    testStreamId = stream.id;

    const event = await prisma.event.create({
      data: {
        streamId: stream.id,
        method: 'POST',
        path: '/test',
        headers: { 'content-type': 'application/json' },
        rawBody: Buffer.from('{"test": "data"}'),
      },
    });
    testEventId = event.id;

    app = createApp(prisma);
  });

  afterAll(async () => {
    await prisma.replayAttempt.deleteMany({ where: { eventId: testEventId } });
    await prisma.event.deleteMany({ where: { id: testEventId } });
    await prisma.stream.deleteMany({ where: { id: testStreamId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  it('should block localhost targets', async () => {
    const response = await request(app)
      .post(`/events/${testEventId}/replay`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ targetUrl: 'http://localhost:3000/test' })
      .expect(400);

    expect(response.body.error.code).toBe('SSRF_PROTECTION');
  });

  it('should block private IP ranges', async () => {
    const response = await request(app)
      .post(`/events/${testEventId}/replay`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ targetUrl: 'http://192.168.1.1/test' })
      .expect(400);

    expect(response.body.error.code).toBe('SSRF_PROTECTION');
  });

  it('should block non-HTTP(S) schemes', async () => {
    const response = await request(app)
      .post(`/events/${testEventId}/replay`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ targetUrl: 'file:///etc/passwd' })
      .expect(400);

    expect(response.body.error.code).toBe('SSRF_PROTECTION');
  });

  it('should successfully replay to allowed target', async () => {
    // Use httpbin.org as a public test endpoint
    // Note: This test requires internet connectivity
    const response = await request(app)
      .post(`/events/${testEventId}/replay`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ targetUrl: 'https://httpbin.org/post' })
      .expect(200);

    expect(response.body.status).toBe('success');
    expect(response.body.responseStatus).toBe(200);
    expect(response.body.durationMs).toBeGreaterThan(0);

    // Verify replay attempt was persisted
    const attempts = await prisma.replayAttempt.findMany({
      where: { eventId: testEventId },
    });
    expect(attempts.length).toBeGreaterThan(0);
    expect(attempts[0].status).toBe('success');
  });
});
