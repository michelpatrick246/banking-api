import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountStatus,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { AccountsLimitService } from 'src/accounts/accounts-limit.service';
import { DatabaseService } from 'src/database/database.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly accountLimitsService: AccountsLimitService,
  ) {}

  async create(userId: number, createTransactionDto: CreateTransactionDto) {
    const { type, amount, sourceAccountId, destinationAccountNumber } =
      createTransactionDto;

    // ✅ VÉRIFIER LES LIMITES AVANT LA TRANSACTION
    if (
      sourceAccountId &&
      (type === TransactionType.WITHDRAWAL || type === TransactionType.TRANSFER)
    ) {
      const limitCheck = await this.accountLimitsService.checkTransactionLimits(
        sourceAccountId,
        type,
        amount,
      );

      if (!limitCheck.allowed) {
        throw new BadRequestException(limitCheck.reason);
      }
    }

    switch (type) {
      case TransactionType.DEPOSIT:
        return this.deposit(userId, createTransactionDto);
      case TransactionType.WITHDRAWAL:
        return this.withdrawal(userId, createTransactionDto);
      case TransactionType.TRANSFER:
        if (!sourceAccountId || !destinationAccountNumber) {
          throw new BadRequestException(
            'Source and destination required for transfer',
          );
        }
        return this.transfer(userId, createTransactionDto);
      default:
        throw new BadRequestException('Invalid transaction type');
    }
  }

  private async deposit(userId: number, dto: CreateTransactionDto) {
    const transaction = await this.databaseService.$transaction(async (tx) => {
      const account = await tx.account.findUnique({
        where: { id: dto.destinationAccountId, userId },
      });

      if (!account) {
        throw new NotFoundException('Account not found');
      }

      if (account.status !== AccountStatus.ACTIVE) {
        throw new BadRequestException('Account is not active');
      }

      await tx.account.update({
        where: { id: dto.destinationAccountId },
        data: {
          balance: {
            increment: dto.amount,
          },
        },
      });

      return await tx.transaction.create({
        data: {
          type: dto.type,
          amount: dto.amount,
          description: dto.description,
          destinationAccountId: account.id,
          status: TransactionStatus.COMPLETED,
        },
      });
    });

    return transaction;
  }

  private async transfer(userId: number, dto: CreateTransactionDto) {
    const transaction = await this.databaseService.$transaction(async (tx) => {
      const [sourceAccount, destAccount] = await Promise.all([
        tx.account.findUnique({
          where: { id: dto.sourceAccountId, userId },
        }),
        tx.account.findUnique({
          where: { accountNumber: dto.destinationAccountNumber },
        }),
      ]);

      console.log('Source Account:', sourceAccount);
      console.log('Destination Account:', destAccount);

      if (!sourceAccount) {
        throw new NotFoundException('Source account not found');
      }

      if (!destAccount) {
        throw new NotFoundException('Destination account not found');
      }

      if (sourceAccount.id === destAccount.id) {
        throw new BadRequestException('Cannot transfer to same account');
      }

      if (
        sourceAccount.status !== AccountStatus.ACTIVE ||
        destAccount.status !== AccountStatus.ACTIVE
      ) {
        throw new BadRequestException('One or both accounts are not active');
      }

      const newSourceBalance = Number(sourceAccount.balance) - dto.amount;
      const minBalance = -Number(sourceAccount.overdraftLimit);

      if (newSourceBalance < minBalance) {
        throw new BadRequestException('Insufficient funds');
      }

      // 2️⃣ Débit du compte source
      await tx.account.update({
        where: { id: sourceAccount.id },
        data: {
          balance: {
            decrement: dto.amount,
          },
        },
      });

      // 3️⃣ Crédit du compte destination
      await tx.account.update({
        where: { id: destAccount.id },
        data: {
          balance: {
            increment: dto.amount,
          },
        },
      });

      return await tx.transaction.create({
        data: {
          type: dto.type,
          amount: dto.amount,
          description: dto.description,
          sourceAccountId: sourceAccount.id,
          destinationAccountId: destAccount.id,
          status: TransactionStatus.COMPLETED,
        },
      });
    });

    return transaction;
  }

  async findAllByAccount(accountId: string, userId: number) {
    const account = await this.databaseService.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (account.userId !== userId) {
      throw new BadRequestException('Access denied');
    }

    return this.databaseService.transaction.findMany({
      where: {
        OR: [
          { sourceAccountId: accountId },
          { destinationAccountId: accountId },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async withdrawal(userId: number, dto: CreateTransactionDto) {
    const transaction = await this.databaseService.$transaction(async (tx) => {
      const account = await tx.account.findUnique({
        where: { id: dto.sourceAccountId, userId },
      });

      if (!account) {
        throw new NotFoundException('Account not found');
      }

      if (account.status !== AccountStatus.ACTIVE) {
        throw new BadRequestException('Account is not active');
      }

      const newBalance = Number(account.balance) - dto.amount;
      const minBalance = -Number(account.overdraftLimit);

      if (newBalance < minBalance) {
        throw new BadRequestException('Insufficient funds');
      }

      await tx.account.update({
        where: { id: dto.sourceAccountId },
        data: {
          balance: {
            decrement: dto.amount,
          },
        },
      });

      return await tx.transaction.create({
        data: {
          type: dto.type,
          amount: dto.amount,
          description: dto.description,
          sourceAccountId: account.id,
          status: TransactionStatus.COMPLETED,
        },
      });
    });

    return transaction;
  }
}
