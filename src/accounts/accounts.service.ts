import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { AccountStatus } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { CreateAccountDto } from './dto/create-account.dto';

@Injectable()
export class AccountsService {
  constructor(private readonly accountRepository: DatabaseService) {}

  async create(userId: number, createAccountDto: CreateAccountDto) {
    const accountNumber = this.generateAccountNumber();

    const account = this.accountRepository.account.create({
      data: {
        type: createAccountDto.type,
        accountNumber,
        userId,
        balance: createAccountDto.initialDeposit || 0,
      },
    });

    return account;
  }

  async findAllByUser(userId: number) {
    return this.accountRepository.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: number) {
    const account = await this.accountRepository.account.findUnique({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (account.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return account;
  }

  async findByAccountNumber(accountNumber: string) {
    const account = await this.accountRepository.account.findUnique({
      where: { accountNumber },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  async updateBalance(accountId: string, amount: number) {
    const account = await this.accountRepository.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (account.status !== AccountStatus.ACTIVE) {
      throw new BadRequestException('Account is not active');
    }

    const newBalance = Number(account.balance) + amount;
    const minBalance = -Number(account.overdraftLimit);

    if (newBalance < minBalance) {
      throw new BadRequestException('Insufficient funds');
    }

    account.balance = newBalance;
    return this.accountRepository.account.update({
      where: { id: accountId },
      data: { balance: newBalance },
    });
  }

  private generateAccountNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `FR76${timestamp.slice(-10)}${random}`;
  }
}
