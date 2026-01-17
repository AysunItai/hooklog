// Load environment variables first
import 'dotenv/config';

import { createApp } from './app';
import { prisma } from './db/client';
import { config } from './config';
import { logger } from './utils/logger';

async function main() {
  try {
    // Test database connection explicitly
    await prisma.$connect();
    logger.info('Database connected');

    const app = createApp(prisma);

    const server = app.listen(config.port, () => {
      logger.info(
        {
          port: config.port,
          nodeEnv: config.nodeEnv,
        },
        'Server started'
      );
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');
      server.close(async () => {
        try {
          await prisma.$disconnect();
          logger.info('Database disconnected');
        } catch (err) {
          logger.error({ err }, 'Error during Prisma disconnect');
        }
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err: any) {
    logger.error(
      {
        message: err?.message,
        code: err?.code,
        errorCode: err?.errorCode,
        meta: err?.meta,
        stack: err?.stack,
        err,
      },
      'Failed to start server'
    );
    process.exit(1);
  }
}

main();
