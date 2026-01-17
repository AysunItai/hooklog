import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger'; // or whatever you use

export const prisma = new PrismaClient();

export async function initDb() {
  try {
    await prisma.$connect();
    logger.info('Prisma connected');
  } catch (err) {
    // log everything, not just msg
    logger.error({ err }, 'Prisma failed to connect');
    throw err;
  }
}
