import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly client: OpenAI | null;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.model = this.configService.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
    this.client = apiKey ? new OpenAI({ apiKey }) : null;
  }

  async generateAdvice(params: {
    systemPrompt: string;
    userPrompt: string;
  }): Promise<string> {
    if (!this.client) {
      throw new ServiceUnavailableException();
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

      const statusCode =
        typeof error === 'object' && error !== null && 'status' in error
          ? (error as { status?: number }).status
          : undefined;
      if (statusCode === 429) {
        throw new HttpException(
          'AI service rate limited. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      const detail =
        error instanceof Error ? error.message : 'Unknown provider error';
      this.logger.error(`[OpenAI] completion failed: ${detail}`);
      throw new InternalServerErrorException(
        'Failed to generate AI analysis response',
      );
    }
  }
}
