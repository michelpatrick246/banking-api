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
import { DatabaseService } from 'src/database/database.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(userId: number, createTransactionDto: CreateTransactionDto) {
    const { type, amount, sourceAccountId, destinationAccountNumber } =
      createTransactionDto;

    switch (type) {
      case TransactionType.DEPOSIT:
        return this.deposit(userId, createTransactionDto);
      //   case TransactionType.WITHDRAWAL:
      //     return this.withdrawal(userId, createTransactionDto);
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
    return await this.databaseService.$transaction(async (tx) => {
      const account = await tx.account.findUnique({
        where: { id: dto.destinationAccountId, userId },
      });

      if (!account) {
        throw new NotFoundException('Account not found');
      }

      if (account.status !== AccountStatus.ACTIVE) {
        throw new BadRequestException('Account is not active');
      }

      const transaction = await tx.transaction.create({
        data: {
          type: dto.type,
          amount: dto.amount,
          description: dto.description,
          destinationAccountId: account.id,
          status: TransactionStatus.COMPLETED,
        },
      });

      await tx.account.update({
        where: { id: dto.destinationAccountId },
        data: {
          balance: {
            increment: dto.amount,
          },
        },
      });

      return transaction;
    });
  }

  private async transfer(userId: number, dto: CreateTransactionDto) {
    return await this.databaseService.$transaction(async (tx) => {
      const [sourceAccount, destAccount] = await Promise.all([
        tx.account.findUnique({
          where: { id: dto.sourceAccountId, userId },
        }),
        tx.account.findUnique({
          where: { accountNumber: dto.destinationAccountNumber },
        }),
      ]);

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

      const newDestBalance = Number(destAccount.balance) + dto.amount;

      // 2️⃣ Débit du compte source
      await tx.account.update({
        where: { id: sourceAccount.id },
        data: {
          balance: newSourceBalance,
        },
      });

      // 3️⃣ Crédit du compte destination
      await tx.account.update({
        where: { id: destAccount.id },
        data: {
          balance: newDestBalance,
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          type: dto.type,
          amount: dto.amount,
          description: dto.description,
          sourceAccountId: sourceAccount.id,
          destinationAccountId: destAccount.id,
          status: TransactionStatus.COMPLETED,
        },
      });

      return transaction;
    });
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
}
