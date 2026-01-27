import { Module } from '@nestjs/common';
import { AuditLogModule } from 'src/audit_log/audit_log.module';
import { DatabaseModule } from 'src/database/database.module';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({
  providers: [TransactionsService],
  controllers: [TransactionsController],
  imports: [DatabaseModule, AuditLogModule],
})
export class TransactionsModule {}
