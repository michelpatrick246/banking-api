import { TransactionType } from '@prisma/client';
import {
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    Min,
} from 'class-validator';

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  sourceAccountId?: string;

  @IsOptional()
  @IsUUID()
  destinationAccountId?: string;

  @IsOptional()
  @IsString()
  destinationAccountNumber?: string;
}
