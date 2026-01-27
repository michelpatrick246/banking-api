import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { type User } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import { AuditAction } from 'src/common/decorators/audit-action.decorator';
import { AuditInterceptor } from 'src/common/interceptor/audit_log.interceptor';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@UseInterceptors(AuditInterceptor)
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @AuditAction('CREATE_TRANSACTION', 'Transaction')
  @ApiOperation({
    summary: 'Créer une transaction',
    description: `
      Effectue une transaction bancaire (DEPOSIT, WITHDRAWAL ou TRANSFER).
      
      **DEPOSIT**: Nécessite destinationAccountId
      **WITHDRAWAL**: Nécessite sourceAccountId
      **TRANSFER**: Nécessite sourceAccountId et destinationAccountNumber
      
      Toutes les transactions sont atomiques avec rollback en cas d'erreur.
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Transaction effectuée avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides ou fonds insuffisants',
    schema: {
      example: {
        statusCode: 400,
        message: 'Insufficient funds',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Compte non trouvé' })
  create(
    @CurrentUser() user: User,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(user.id, createTransactionDto);
  }

  @Get('account/:accountId')
  @ApiOperation({
    summary: "Historique des transactions d'un compte",
    description:
      "Retourne les dernières transactions d'un compte (entrantes et sortantes)",
  })
  @ApiParam({
    name: 'accountId',
    description: 'ID du compte',
    example: 'uuid-1234-5678',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des transactions',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Compte non trouvé' })
  findAllByAccount(
    @CurrentUser() user: User,
    @Param('accountId') accountId: string,
  ) {
    return this.transactionsService.findAllByAccount(accountId, user.id);
  }
}
