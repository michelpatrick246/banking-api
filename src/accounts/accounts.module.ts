import { Module } from '@nestjs/common';
import { AuditLogModule } from 'src/audit_log/audit_log.module';
import { DatabaseModule } from 'src/database/database.module';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';

@Module({
  providers: [AccountsService],
  imports: [DatabaseModule, AuditLogModule],
  controllers: [AccountsController],
  exports: [AccountsService],
})
export class AccountsModule {}
