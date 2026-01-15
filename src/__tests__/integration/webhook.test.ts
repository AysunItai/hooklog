import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../../app';
import { prisma } from '../../db/client';

describe('Webhook Ingest', () => {
  let app: Express;
  let testStreamToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create test user and stream
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'hashedpassword',
      },
    });
    testUserId = user.id;

    const stream = await prisma.stream.create({
      data: {
        userId: user.id,
        token: 'test-token-123',
      },
    });
    testStreamToken = stream.token;

    app = createApp(prisma);
  });

  afterAll(async () => {
    // Cleanup
    await prisma.event.deleteMany({ where: { stream: { userId: testUserId } } });
    await prisma.stream.deleteMany({ where: { userId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  it('should capture raw webhook body and headers accurately', async () => {
    const testBody = Buffer.from('{"test": "data", "number": 123}');
    const testHeaders = {
      'content-type': 'application/json',
      'x-custom-header': 'custom-value',
    };

    const response = await request(app)
      .post(`/i/${testStreamToken}`)
      .set(testHeaders)
      .send(testBody)
      .expect(201);

    expect(response.body).toHaveProperty('id');

    const event = await prisma.event.findUnique({
      where: { id: response.body.id },
    });

    expect(event).toBeDefined();
    expect(event?.method).toBe('POST');
    expect(event?.headers).toMatchObject({
      'content-type': 'application/json',
      'x-custom-header': 'custom-value',
    });
    expect(Buffer.from(event?.rawBody as Buffer)).toEqual(testBody);
    expect(event?.contentLength).toBe(testBody.length);
  });

  it('should reject requests exceeding size limit', async () => {
    const largeBody = Buffer.alloc(300 * 1024); // 300KB, exceeds 256KB limit

    await request(app)
      .post(`/i/${testStreamToken}`)
      .send(largeBody)
      .expect(413);
  });

  it('should return 404 for invalid token', async () => {
    await request(app)
      .post('/i/invalid-token')
      .send('test')
      .expect(404);
  });
});
