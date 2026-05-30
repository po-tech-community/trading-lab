import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ timestamps: true, collection: 'audit_logs' })
export class AuditLog {
  @Prop({ required: true, trim: true })
  action: string;

  @Prop({ required: true, trim: true })
  userId: string;

  @Prop({ type: Date, required: true, default: Date.now })
  occurredAt: Date;

  @Prop({ type: Object, default: null })
  metadata?: Record<string, unknown> | null;

  createdAt: Date;

  updatedAt: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
