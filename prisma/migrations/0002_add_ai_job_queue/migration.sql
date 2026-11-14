-- CreateTable
CREATE TABLE "AiJob" (
    "id" TEXT NOT NULL,
    "batchId" TEXT,
    "grafikKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "modelUsed" TEXT,
    "lastError" TEXT,
    "nextRunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiJob_status_nextRunAt_createdAt_idx" ON "AiJob"("status", "nextRunAt", "createdAt");

-- CreateIndex
CREATE INDEX "AiJob_grafikKey_status_idx" ON "AiJob"("grafikKey", "status");
