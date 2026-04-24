import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

@Injectable()
export class LlmService {
  private readonly client: OpenAI | null;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const envFile = this.readAiConfigFromEnvFile();
    const apiKey =
      envFile.apiKey ?? this.configService.get<string>('OPENAI_API_KEY');
    this.model =
      envFile.model ??
      this.configService.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
    this.client = apiKey ? new OpenAI({ apiKey }) : null;
  }

  private readAiConfigFromEnvFile(): { apiKey?: string; model?: string } {
    try {
      const envPath = join(process.cwd(), '.env');
      const content = readFileSync(envPath, 'utf-8');
      const extract = (name: string): string | undefined => {
        const match = content.match(new RegExp(`^${name}=(.*)$`, 'm'));
        if (!match?.[1]) return undefined;
        return match[1].trim().replace(/^["']|["']$/g, '');
      };
      return {
        apiKey: extract('OPENAI_API_KEY'),
        model: extract('OPENAI_MODEL'),
      };
    } catch {
      return {};
    }
  }

  async generateAdvice(params: {
    systemPrompt: string;
    userPrompt: string;
  }): Promise<string> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'OPENAI_API_KEY is missing. Configure it in .env to use AI analyze.',
      );
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: params.systemPrompt },
          { role: 'user', content: params.userPrompt },
        ],
      });

      const content = completion.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new InternalServerErrorException('LLM returned an empty response');
      }

      return content;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      const detail =
        error instanceof Error ? error.message : 'Unknown provider error';
      // Temporary diagnostic log to surface provider-level failures in dev.
      console.error('[AI][OpenAI] completion failed:', detail);
      throw new InternalServerErrorException(
        `Failed to generate AI analysis response: ${detail}`,
      );
    }
  }
}
