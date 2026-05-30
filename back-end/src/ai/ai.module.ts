import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { PromptGeneratorService } from './prompt-generator.service';
import { LlmService } from './llm.service';
import { AuthModule } from '../auth/auth.module';
import { AiRateLimitGuard } from './guards/ai-rate-limit.guard';
import { AuditModule } from '../audit/audit.module';
import { McpConfigService } from './mcp/mcp-config.service';
import { McpPermissionService } from './mcp/mcp-permission.service';
import { McpProviderRegistry } from './mcp/mcp-provider.registry';
import { McpRuntimeService } from './mcp/mcp-runtime.service';

@Module({
  imports: [ConfigModule, AuthModule, AuditModule],
  controllers: [AiController],
  providers: [
    AiService,
    PromptGeneratorService,
    LlmService,
    AiRateLimitGuard,
    McpConfigService,
    McpPermissionService,
    McpProviderRegistry,
    McpRuntimeService,
  ],
  exports: [AiService],
})
export class AiModule {}
