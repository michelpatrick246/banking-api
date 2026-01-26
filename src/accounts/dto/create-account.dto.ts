import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateAccountDto {
  @ApiProperty({
    enum: AccountType,
    example: 'CHECKING',
    description: 'Type de compte bancaire',
  })
  @IsEnum(AccountType)
  type: AccountType;

  @ApiPropertyOptional({
    example: 1000,
    description: 'Dépôt initial (optionnel)',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  initialDeposit?: number;

  @ApiPropertyOptional({
    example: 500,
    description: 'Limite de découvert autorisé (optionnel)',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  overdraftLimit?: number;
}
