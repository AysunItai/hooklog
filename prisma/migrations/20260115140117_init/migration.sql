-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stream" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "name" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stream_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "headers" JSONB NOT NULL,
    "rawBody" BYTEA NOT NULL,
    "sourceIp" TEXT,
    "contentLength" INTEGER,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReplayAttempt" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL,
    "durationMs" INTEGER,
    "responseStatus" INTEGER,
    "responseBody" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReplayAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Stream_token_key" ON "Stream"("token");

-- CreateIndex
CREATE INDEX "Event_streamId_receivedAt_id_idx" ON "Event"("streamId", "receivedAt", "id");

-- CreateIndex
CREATE INDEX "Event_receivedAt_id_idx" ON "Event"("receivedAt", "id");

-- CreateIndex
CREATE INDEX "ReplayAttempt_eventId_idx" ON "ReplayAttempt"("eventId");

-- AddForeignKey
ALTER TABLE "Stream" ADD CONSTRAINT "Stream_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "Stream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplayAttempt" ADD CONSTRAINT "ReplayAttempt_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
