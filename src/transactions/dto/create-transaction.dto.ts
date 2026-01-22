import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({
    enum: TransactionType,
    example: TransactionType.DEPOSIT,
    description: 'Type de transaction',
  })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({
    example: 100.5,
    description: 'Montant de la transaction',
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({
    example: 'Dépôt de salaire',
    description: 'Description de la transaction (optionnel)',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'uuid-source-account',
    description: 'ID du compte source (requis pour WITHDRAWAL et TRANSFER)',
  })
  @IsOptional()
  @IsUUID()
  sourceAccountId?: string;

  @ApiPropertyOptional({
    example: 'uuid-dest-account',
    description: 'ID du compte destination (requis pour DEPOSIT)',
  })
  @IsOptional()
  @IsUUID()
  destinationAccountId?: string;

  @ApiPropertyOptional({
    example: 'FR7612345678901234567890',
    description: 'Numéro de compte destination (requis pour TRANSFER)',
  })
  @IsOptional()
  @IsString()
  destinationAccountNumber?: string;
}
