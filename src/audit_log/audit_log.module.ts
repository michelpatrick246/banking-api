import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { AuditLogService } from './audit_log.service';
import { AuditLogController } from './audit_log.controller';

@Module({
  imports: [DatabaseModule],
  providers: [AuditLogService],
  exports: [AuditLogService],
  controllers: [AuditLogController],
})
export class AuditLogModule {}
