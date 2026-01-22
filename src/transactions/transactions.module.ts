import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({
  providers: [TransactionsService],
  controllers: [TransactionsController],
  imports: [DatabaseModule],
})
export class TransactionsModule {}
