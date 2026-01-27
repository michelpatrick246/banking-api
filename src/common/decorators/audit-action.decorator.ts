// src/common/decorators/audit-action.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit_action';

export const AuditAction = (action: string, entityType: string) =>
  SetMetadata(AUDIT_KEY, { action, entityType });
