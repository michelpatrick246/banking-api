import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { AuditLogDto } from './dto/audit_log.dto';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly db: DatabaseService) {}

  async log(data: AuditLogDto) {
    try {
      await this.db.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          entity: data.entityType,
          entityId: data.entityId || null,
          details: data.details || {},
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
        },
      });

      this.logger.log(
        `[AUDIT] ${data.action} by user ${data.userId || 'anonymous'} on ${data.entityType}`,
      );
    } catch (error) {
      this.logger.error('Failed to create audit log', error);
    }
  }

  /**
   * Récupère les logs d'un utilisateur
   */
  async getUserLogs(userId: number, limit = 50) {
    return await this.db.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getRecentLogs(limit: number = 100) {
    return await this.db.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
