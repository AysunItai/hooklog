# Prisma Migration Setup

After setting up your database connection, create and apply the initial migration:

```bash
# Generate Prisma Client
npm run prisma:generate

# Create initial migration
npx prisma migrate dev --name init

# Or apply migrations in production
npx prisma migrate deploy
```

The schema includes:
- Users table with email/password authentication
- Streams table for webhook endpoints
- Events table with bytea for raw body storage
- ReplayAttempts table for replay history
- Proper indexes for efficient pagination
