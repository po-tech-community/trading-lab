import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { PromptGeneratorService } from './prompt-generator.service';
import { LlmService } from './llm.service';

@Module({
  imports: [ConfigModule],
  controllers: [AiController],
  providers: [AiService, PromptGeneratorService, LlmService],
  exports: [AiService],
})
export class AiModule {}
