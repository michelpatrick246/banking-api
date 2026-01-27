import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogService } from 'src/audit_log/audit_log.service';
import { AUDIT_KEY } from 'src/common/decorators/audit-action.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private auditService: AuditLogService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditMeta = this.reflector.get(AUDIT_KEY, context.getHandler());

    if (!auditMeta) return next.handle();

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const ipAddress = request.ip;
    const userAgent = request.get('user-agent');

    return next.handle().pipe(
      tap((result) => {
        this.auditService.log({
          userId: user?.id,
          action: auditMeta.action,
          entityType: auditMeta.entityType,
          entityId: result?.id,
          details: result,
          ipAddress,
          userAgent,
        });
      }),
    );
  }
}
