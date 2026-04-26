import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { PromptGeneratorService } from './prompt-generator.service';
import { LlmService } from './llm.service';
import { AuthModule } from '../auth/auth.module';
import { AiRateLimitGuard } from './guards/ai-rate-limit.guard';

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [AiController],
  providers: [AiService, PromptGeneratorService, LlmService, AiRateLimitGuard],
  exports: [AiService],
})
export class AiModule {}
