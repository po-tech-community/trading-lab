import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import {Document} from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true })

export class AuditLog {
    @Prop({ required: true })
    event: string;

    @Prop()
    userId: string;

    @Prop()
    email: string;

    @Prop()
    userAgent: string;

    @Prop({type: Object})
    metadata: Record<string, any>;

    @Prop ({default: Date.now})
    timestamp: Date;
}

export const AuditSchema = SchemaFactory.createForClass(AuditLog);