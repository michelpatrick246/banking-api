import { BadRequestException, Injectable } from '@nestjs/common';
import { TransactionStatus, TransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/client';
import { DatabaseService } from 'src/database/database.service';

export interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  currentUsage?: number;
  limit?: number;
}

@Injectable()
export class AccountsLimitService {
  constructor(private readonly db: DatabaseService) {}

  async checkTransactionLimits(
    accountId: string,
    transactionType: TransactionType,
    amount: number,
  ): Promise<LimitCheckResult> {
    const account = await this.db.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new BadRequestException('Compte non trouvé');
    }

    // Vérifier selon le type de transaction
    if (transactionType === TransactionType.WITHDRAWAL) {
      return this.checkDailyWithdrawalLimit(
        accountId,
        amount,
        account.dailyWithdrawalLimit,
      );
    }

    if (transactionType === TransactionType.TRANSFER) {
      const dailyCheck = await this.checkDailyTransferLimit(
        accountId,
        amount,
        account.dailyTransferLimit,
      );
      if (!dailyCheck.allowed) return dailyCheck;

      const monthlyCheck = await this.checkMonthlyTransferLimit(
        accountId,
        amount,
        account.monthlyTransferLimit,
      );
      if (!monthlyCheck.allowed) return monthlyCheck;
    }

    // Vérifier le nombre de transactions
    const countCheck = await this.checkDailyTransactionCount(
      accountId,
      account.maxTransactionsPerDay,
    );
    if (!countCheck.allowed) return countCheck;

    return { allowed: true };
  }

  /**
   * Vérifie la limite de retrait quotidien
   */
  private async checkDailyWithdrawalLimit(
    accountId: string,
    amount: number,
    limit: Decimal,
  ): Promise<LimitCheckResult> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayWithdrawals = await this.db.transaction.aggregate({
      where: {
        sourceAccountId: accountId,
        type: TransactionType.WITHDRAWAL,
        status: 'COMPLETED',
        createdAt: { gte: today },
      },
      _sum: { amount: true },
    });

    const currentUsage = Number(todayWithdrawals._sum.amount || 0);
    const limitValue = Number(limit);
    const newTotal = currentUsage + amount;

    if (newTotal > limitValue) {
      return {
        allowed: false,
        reason: `Daily withdrawal limit exceeded. Limit: ${limitValue}€, Current: ${currentUsage}€, Requested: ${amount}€`,
        currentUsage,
        limit: limitValue,
      };
    }

    return { allowed: true, currentUsage, limit: limitValue };
  }

  /**
   * Vérifie la limite de virement quotidien
   */
  private async checkDailyTransferLimit(
    accountId: string,
    amount: number,
    limit: Decimal,
  ): Promise<LimitCheckResult> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTransfers = await this.db.transaction.aggregate({
      where: {
        sourceAccountId: accountId,
        type: TransactionType.TRANSFER,
        status: TransactionStatus.COMPLETED,
        createdAt: { gte: today },
      },
      _sum: { amount: true },
    });
    const currentUsage = Number(todayTransfers._sum.amount || 0);
    const limitValue = Number(limit);
    const newTotal = currentUsage + amount;

    if (newTotal > limitValue) {
      return {
        allowed: false,
        reason: `Daily transfer limit exceeded. Limit: ${limitValue}€, Current: ${currentUsage}€, Requested: ${amount}€`,
        currentUsage,
        limit: limitValue,
      };
    }

    return { allowed: true, currentUsage, limit: limitValue };
  }

  /**
   * Vérifie la limite de virement mensuel
   */
  private async checkMonthlyTransferLimit(
    accountId: string,
    amount: number,
    limit: Decimal,
  ): Promise<LimitCheckResult> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthTransfers = await this.db.transaction.aggregate({
      where: {
        sourceAccountId: accountId,
        type: TransactionType.TRANSFER,
        status: 'COMPLETED',
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    });

    const currentUsage = Number(monthTransfers._sum.amount || 0);
    const limitValue = Number(limit);
    const newTotal = currentUsage + amount;

    if (newTotal > limitValue) {
      return {
        allowed: false,
        reason: `Monthly transfer limit exceeded. Limit: ${limitValue}€, Current: ${currentUsage}€, Requested: ${amount}€`,
        currentUsage,
        limit: limitValue,
      };
    }

    return { allowed: true, currentUsage, limit: limitValue };
  }

  /**
   * Vérifie le nombre de transactions quotidiennes
   */
  private async checkDailyTransactionCount(
    accountId: string,
    maxTransactions: number,
  ): Promise<LimitCheckResult> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCount = await this.db.transaction.count({
      where: {
        OR: [
          { sourceAccountId: accountId },
          { destinationAccountId: accountId },
        ],
        status: 'COMPLETED',
        createdAt: { gte: today },
      },
    });

    if (todayCount >= maxTransactions) {
      return {
        allowed: false,
        reason: `Daily transaction limit reached. Maximum: ${maxTransactions}, Current: ${todayCount}`,
        currentUsage: todayCount,
        limit: maxTransactions,
      };
    }

    return { allowed: true, currentUsage: todayCount, limit: maxTransactions };
  }
}
