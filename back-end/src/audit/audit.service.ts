import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { AuditLog, AuditLogDocument } from "./schemas/audit.schemas";
import { Model } from "mongoose";


export type AuditEventType = 
| 'REGISTER'
| 'LOGIN'
| 'LOGOUT'
| 'REFRESH'
| 'PROFILE_UPDATE'
| 'SOFT_DELETE'

export interface AuditPayload {
    event: AuditEventType;
    userId?: String;
    email?: string;
    ip?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
}

@Injectable()
export class AuditService {
    private readonly logger = new Logger(AuditService.name);

    constructor(
        @InjectModel(AuditLog.name)
        private auditLogModel: Model<AuditLogDocument>,
    ) {}

    async log(payload: AuditPayload): Promise<void> {
        const entry = {
            ...payload,
            timestamp: new Date(),
        };

        this.logger.log(
            `[${entry.event}] userId=${entry.userId ?? 'anonymous'} email=${entry.email ?? '-'} ip=${entry.ip ?? '-'} at ${entry.timestamp.toISOString()}`
        );

        try {
            await this.auditLogModel.create(entry);
        } catch (err) {
            this.logger.error('Failed to persist audit log', err)
        }
    }
}
