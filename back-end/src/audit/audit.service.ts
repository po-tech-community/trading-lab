import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

export type AuthAuditAction =
  | 'register'
  | 'login'
  | 'logout'
  | 'refresh'
  | 'profile_update'
  | 'soft_delete';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async logAuthEvent(
    action: AuthAuditAction,
    userId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const occurredAt = new Date();
    const payload = {
      scope: 'auth_audit',
      action,
      userId,
      timestamp: occurredAt.toISOString(),
      metadata: metadata ?? null,
    };

    this.logger.log(JSON.stringify(payload));

    try {
      await this.auditLogModel.create({
        action,
        userId,
        occurredAt,
        metadata: metadata ?? null,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown audit persistence error';
      this.logger.error(`Failed to persist audit log: ${message}`);
    }
  }
}
