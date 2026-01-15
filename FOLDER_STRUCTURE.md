# Hooklog Project Structure

```
HOOKLOG/
├── prisma/
│   └── schema.prisma              # Database schema (Users, Streams, Events, ReplayAttempts)
├── src/
│   ├── __tests__/
│   │   └── integration/
│   │       ├── webhook.test.ts   # Webhook ingest tests
│   │       ├── pagination.test.ts # Cursor pagination tests
│   │       └── replay.test.ts    # SSRF protection and replay tests
│   ├── config/
│   │   └── index.ts               # Configuration management
│   ├── controllers/
│   │   ├── auth.controller.ts    # Authentication endpoints
│   │   ├── event.controller.ts   # Event listing and retrieval
│   │   ├── replay.controller.ts  # Replay functionality
│   │   ├── stream.controller.ts  # Stream management
│   │   └── webhook.controller.ts # Webhook ingest
│   ├── db/
│   │   └── client.ts             # Prisma client initialization
│   ├── errors/
│   │   └── index.ts              # Custom error classes
│   ├── middleware/
│   │   ├── auth.ts               # JWT authentication middleware
│   │   ├── errorHandler.ts      # Centralized error handling
│   │   ├── rawBody.ts           # Raw body capture middleware
│   │   ├── requestId.ts         # Request ID middleware
│   │   └── timeout.ts           # Request timeout middleware
│   ├── repositories/
│   │   ├── event.repository.ts   # Event data access
│   │   ├── replay.repository.ts # Replay attempt data access
│   │   ├── stream.repository.ts # Stream data access
│   │   ├── user.repository.ts   # User data access
│   │   └── index.ts             # Repository aggregator
│   ├── routes/
│   │   ├── auth.routes.ts        # Auth route definitions
│   │   ├── event.routes.ts       # Event route definitions
│   │   ├── replay.routes.ts      # Replay route definitions
│   │   ├── stream.routes.ts     # Stream route definitions
│   │   ├── webhook.routes.ts    # Webhook ingest routes
│   │   └── index.ts             # Route aggregator
│   ├── services/
│   │   ├── auth.service.ts       # Authentication business logic
│   │   ├── replay.service.ts     # Replay with SSRF protection
│   │   ├── stream.service.ts     # Stream management logic
│   │   └── webhook.service.ts    # Webhook capture logic
│   ├── types/
│   │   └── index.ts              # TypeScript type definitions
│   ├── utils/
│   │   ├── logger.ts            # Pino logger setup
│   │   ├── pagination.ts        # Cursor pagination utilities
│   │   └── ssrf.ts              # SSRF protection utilities
│   ├── app.ts                   # Express app setup
│   └── index.ts                 # Application entry point
├── .gitignore
├── docker-compose.yml           # PostgreSQL setup
├── package.json
├── README.md                    # Documentation
├── tsconfig.json
└── vitest.config.ts            # Test configuration
```

## Database Schema

The Prisma schema defines four main models:

1. **User**: Authentication and user management
   - id, email, password (hashed), role (USER/ADMIN)
   
2. **Stream**: Webhook streams with unique tokens
   - id, token (unguessable), name (optional), userId
   
3. **Event**: Captured webhook events
   - id, streamId, method, path, headers (JSON), rawBody (bytea)
   - sourceIp, contentLength, receivedAt
   - Indexed on (streamId, receivedAt, id) and (receivedAt, id)
   
4. **ReplayAttempt**: Replay execution records
   - id, eventId, targetUrl, attemptNumber
   - status, durationMs, responseStatus, responseBody (truncated)
   - errorMessage, createdAt

## Key Architectural Decisions

- **Layered Architecture**: Clear separation between routes → controllers → services → repositories
- **Raw Body Storage**: Events store raw body as PostgreSQL `bytea` for perfect fidelity
- **SSRF Protection**: DNS resolution + IP validation before replay
- **Cursor Pagination**: Consistent pagination even with concurrent writes
- **Structured Logging**: Pino with request IDs for traceability
- **Type Safety**: Full TypeScript with Zod validation
- **Error Handling**: Centralized error handler with consistent response format
