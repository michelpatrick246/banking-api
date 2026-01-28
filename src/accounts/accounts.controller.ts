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
  ApiTags,
} from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import { AuditAction } from 'src/common/decorators/audit-action.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AuditInterceptor } from 'src/common/interceptor/audit_log.interceptor';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';

@ApiTags('accounts')
@Controller('accounts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@UseInterceptors(AuditInterceptor)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @AuditAction('CREATE_ACCOUNT', 'Account')
  @ApiOperation({
    summary: 'Créer un nouveau compte bancaire',
    description:
      'Crée un compte CHECKING ou SAVINGS avec un numéro unique généré automatiquement',
  })
  @ApiResponse({
    status: 201,
    description: 'Compte créé avec succès',
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  create(
    @CurrentUser() user: User,
    @Body() createAccountDto: CreateAccountDto,
  ) {
    return this.accountsService.create(user.id, createAccountDto);
  }

  @Get()
  @ApiOperation({
    summary: "Lister tous les comptes de l'utilisateur",
    description:
      "Retourne tous les comptes bancaires appartenant à l'utilisateur connecté",
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des comptes',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  findAll(@CurrentUser() user: User) {
    return this.accountsService.findAllByUser(user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: "Obtenir les détails d'un compte",
    description: "Retourne les informations détaillées d'un compte spécifique",
  })
  @ApiParam({
    name: 'id',
    description: 'ID du compte',
    example: 'uuid-1234-5678',
  })
  @ApiResponse({
    status: 200,
    description: 'Détails du compte',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé - Ce compte ne vous appartient pas',
  })
  @ApiResponse({ status: 404, description: 'Compte non trouvé' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.accountsService.findOne(id, user.id);
  }
}
