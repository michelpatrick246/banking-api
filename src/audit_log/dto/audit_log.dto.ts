import { AuditAction } from '@prisma/client';

export class AuditLogDto {
  userId?: number; // Qui a fait l'action
  action: AuditAction; // Quoi (LOGIN, CREATE_ACCOUNT, etc.)
  entityType: string; // Type d'entité (User, Account, Transaction)
  entityId?: string; // ID de l'entité
  details?: any; // Infos supplémentaires
  ipAddress?: string; // IP de l'utilisateur
  userAgent?: string; //Navigateur ou client utilisé
}
