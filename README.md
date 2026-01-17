# Hooklog

Production-grade webhook capture and replay API built with Node.js 20+, Express, TypeScript, and PostgreSQL.

## Features

- **Raw Webhook Capture**: Captures incoming webhooks exactly as received (raw body + headers)
- **Safe Replay**: Replay captured webhooks to target URLs with SSRF protection
- **JWT Authentication**: Secure API access with role-based authentication
- **Stream Management**: Create and manage multiple webhook streams with unique tokens
- **Cursor-based Pagination**: Efficient event listing with cursor pagination
- **Structured Logging**: Request tracing with structured logging via Pino
- **OpenAPI Documentation**: Full API documentation with Swagger UI
- **Comprehensive Testing**: Integration tests covering core functionality

## Architecture

```
src/
├── config/          # Configuration management
├── controllers/     # Request handlers
├── db/              # Database client
├── errors/          # Custom error classes
├── middleware/      # Express middleware (auth, rawBody, errorHandler, etc.)
├── repositories/    # Data access layer
├── routes/          # Route definitions
├── services/        # Business logic
├── types/           # TypeScript type definitions
└── utils/           # Utility functions (SSRF protection, pagination, logging)
```

## Prerequisites

- Node.js 20+
- PostgreSQL 16+
- npm or yarn

## Project Structure

```
HOOKLOG/
├── frontend/          # React frontend (Vite + TypeScript + Tailwind)
├── src/               # Backend API (Express + TypeScript)
├── prisma/            # Database schema
└── ...
```

## Setup

1. **Clone and install dependencies:**

```bash
npm install
```

2. **Set up environment variables:**

Create a `.env` file based on `.env.example`:

```bash
DATABASE_URL="postgresql://hooklog:hooklog_password@localhost:5432/hooklog?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
MAX_REQUEST_SIZE_KB=256
REQUEST_TIMEOUT_MS=30000
REPLAY_TIMEOUT_MS=10000
REPLAY_MAX_RESPONSE_SIZE_KB=1024
REPLAY_MAX_RETRIES=2
```

3. **Start PostgreSQL:**

Using Docker Compose:

```bash
docker-compose up -d
```

Or use your own PostgreSQL instance and update `DATABASE_URL` accordingly.

4. **Run database migrations:**

```bash
npm run prisma:generate
npm run prisma:migrate
```

5. **Start the backend server:**

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm run build
npm start
```

The API will be available at `http://localhost:3000`

6. **Start the frontend (optional, for development):**

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

**Note:** In production mode, the backend serves the frontend automatically. In development, run both servers separately.

## API Documentation

Once the server is running, access the Swagger UI at:

```
http://localhost:3000/api-docs
```

## API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current user info (requires auth)

### Streams

- `POST /streams` - Create a new webhook stream (requires auth)
- `GET /streams` - List user's streams (requires auth)

### Webhook Ingest

- `POST /i/:token` - Capture incoming webhook (public, token-based)

### Events

- `GET /events` - List events with pagination (requires auth)
  - Query params: `cursor`, `limit`, `streamId`, `method`, `startDate`, `endDate`
- `GET /events/:id` - Get single event details (requires auth)

### Replay

- `POST /events/:id/replay` - Replay event to target URL (requires auth)
  - Body: `{ targetUrl, overrideHeaders?, overrideBody? }`

## Testing

Run integration tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run tests with coverage:

```bash
npm run test:coverage
```

### Test Configuration

Tests require:
- A running PostgreSQL instance (use docker-compose)
- Test database connection configured via `DATABASE_URL`
- Internet connectivity for replay tests (uses httpbin.org)

## Key Features Explained

### Raw Body Capture

Webhooks are captured with their exact raw bytes, stored as `bytea` in PostgreSQL. Headers are stored as JSON. This ensures perfect fidelity for replay.

### SSRF Protection

Replay functionality includes comprehensive SSRF protection:
- Blocks private IP ranges (RFC 1918, RFC 4193)
- Blocks localhost and link-local addresses
- DNS resolution with IP validation
- Only allows HTTP/HTTPS protocols

### Cursor-based Pagination

Events are paginated using cursor-based pagination for consistent results even when new events are added during pagination.

### Request Size Limits

- Ingest endpoint: 256KB default (configurable via `MAX_REQUEST_SIZE_KB`)
- Replay response: 1024KB default (configurable via `REPLAY_MAX_RESPONSE_SIZE_KB`)

### Timeouts

- Ingest timeout: 30s default (configurable via `REQUEST_TIMEOUT_MS`)
- Replay timeout: 10s default (configurable via `REPLAY_TIMEOUT_MS`)

## Future Hardening Considerations

1. **Rate Limiting**: Add rate limiting per user/stream to prevent abuse
2. **IP Allowlisting**: Optional IP allowlisting for ingest endpoints
3. **Webhook Signing**: Verify webhook signatures (e.g., GitHub, Stripe)
4. **Retention Policies**: Automatic cleanup of old events based on age
5. **Metrics & Monitoring**: Add Prometheus metrics and distributed tracing
6. **Queue System**: Use a message queue for async replay processing
7. **Multi-tenancy**: Enhanced isolation between users/organizations
8. **Webhook Transformations**: Allow users to transform payloads before replay
9. **Replay Scheduling**: Schedule replays for future execution
10. **Audit Logging**: Comprehensive audit trail for all operations
11. **Encryption at Rest**: Encrypt sensitive data in database
12. **CORS Configuration**: Proper CORS setup if frontend is added
13. **Request Validation**: Schema validation for known webhook formats
14. **Alerting**: Alert on failed replays or unusual patterns

## License

ISC
