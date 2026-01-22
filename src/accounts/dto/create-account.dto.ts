import { AccountType } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateAccountDto {
  @IsEnum(AccountType)
  type: AccountType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  initialDeposit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  overdraftLimit?: number;
}
