import {
  Controller,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuditLogService } from './audit_log.service';

@ApiTags('audit-log')
@Controller('audit-log')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AuditLogController {
  constructor(private auditService: AuditLogService) {}

  @Get('my-logs')
  @Roles(Role.USER, Role.ADMIN)
  @ApiOperation({
    summary: "Obtenir mes logs d'activité",
    description: "Retourne l'historique des actions de l'utilisateur connecté",
  })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  async getMyLogs(
    @CurrentUser() user: any,
    @Query('limit', ParseIntPipe) limit?: number,
  ) {
    return this.auditService.getUserLogs(user.id, limit || 50);
  }

  @Get('recent-logs')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: "Obtenir les logs d'activité récents",
    description:
      "Retourne les logs d'activité les plus récents de tous les utilisateurs(ADMIN)",
  })
  @ApiQuery({ name: 'limit', required: false, example: 100 })
  async getRecentLogs(@Query('limit', ParseIntPipe) limit?: number) {
    return this.auditService.getRecentLogs(limit || 100);
  }
}
