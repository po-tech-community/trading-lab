import { Module } from "@nestjs/common";
import { AuditService } from "./audit.service";
import { MongooseModule } from "@nestjs/mongoose";
import {  AuditLog, AuditSchema } from "./schemas/audit.schemas";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: AuditLog.name, schema: AuditSchema }])
    ],
    providers: [AuditService],
    exports: [AuditService],
})
export class AuditModule{}