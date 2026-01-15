export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  webhook: {
    maxRequestSizeKB: parseInt(process.env.MAX_REQUEST_SIZE_KB || '256', 10),
    requestTimeoutMs: parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10),
  },
  replay: {
    timeoutMs: parseInt(process.env.REPLAY_TIMEOUT_MS || '10000', 10),
    maxResponseSizeKB: parseInt(process.env.REPLAY_MAX_RESPONSE_SIZE_KB || '1024', 10),
    maxRetries: parseInt(process.env.REPLAY_MAX_RETRIES || '2', 10),
  },
} as const;

// Validate required config
if (!config.database.url) {
  throw new Error('DATABASE_URL is required');
}
if (!config.jwt.secret) {
  throw new Error('JWT_SECRET is required');
}
