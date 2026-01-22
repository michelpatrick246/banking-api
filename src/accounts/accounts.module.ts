import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';

@Module({
  providers: [AccountsService],
  imports: [DatabaseModule],
  controllers: [AccountsController],
  exports: [AccountsService],
})
export class AccountsModule {}
