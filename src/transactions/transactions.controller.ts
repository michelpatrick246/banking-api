import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    UseGuards,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: User,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(user.id, createTransactionDto);
  }

  @Get('account/:accountId')
  findAllByAccount(
    @CurrentUser() user: User,
    @Param('accountId') accountId: string,
  ) {
    return this.transactionsService.findAllByAccount(accountId, user.id);
  }
}
