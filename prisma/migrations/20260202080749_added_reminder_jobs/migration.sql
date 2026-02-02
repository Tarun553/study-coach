-- CreateTable
CREATE TABLE "ReminderJob" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReminderJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReminderJob_runId_createdAt_idx" ON "ReminderJob"("runId", "createdAt");

-- AddForeignKey
ALTER TABLE "ReminderJob" ADD CONSTRAINT "ReminderJob_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AgentRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
