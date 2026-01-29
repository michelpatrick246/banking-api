-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "dailyTransferLimit" DECIMAL(15,2) NOT NULL DEFAULT 5000.0,
ADD COLUMN     "dailyWithdrawalLimit" DECIMAL(15,2) NOT NULL DEFAULT 500,
ADD COLUMN     "maxTransactionsPerDay" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "monthlyTransferLimit" DECIMAL(15,2) NOT NULL DEFAULT 20000.0;

-- CreateIndex
CREATE INDEX "Account_userId_accountNumber_idx" ON "Account"("userId", "accountNumber");
