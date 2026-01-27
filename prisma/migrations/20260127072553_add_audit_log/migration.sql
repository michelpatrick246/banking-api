-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN', 'LOGOUT', 'CREATE_ACCOUNT', 'DEPOSIT', 'TRANSFER', 'WITHDRAW', 'UPDATE_ACCOUNT', 'DELETE_ACCOUNT', 'FAILED_TRANSACTION');

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" INTEGER,
    "action" "AuditAction" NOT NULL,
    "details" JSONB,
    "ipAddress" TEXT,
    "entity" TEXT,
    "entityId" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_userId_action_createdAt_idx" ON "audit_logs"("userId", "action", "createdAt");
