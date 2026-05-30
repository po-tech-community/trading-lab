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
import type { Response } from 'express';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly client: OpenAI | null;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.model = this.configService.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
    this.client = apiKey ? new OpenAI({ apiKey, timeout: 30_000 }) : null;
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
      this.handleOpenAiError(error);
    }
  }

  /**
   * Streams the LLM response token-by-token into an SSE-formatted HTTP response.
   *
   * SSE event format:
   *   data: {"token":"<chunk>"}\n\n   — for each streamed token
   *   data: [DONE]\n\n               — signals end-of-stream
   *   data: {"error":"<msg>"}\n\n    — on error (then closes)
   *
   * The caller is responsible for setting the appropriate headers and keeping
   * the response open before calling this method.
   */
  async generateAdviceStream(
    params: { systemPrompt: string; userPrompt: string },
    res: Response,
  ): Promise<void> {
    if (!this.client) {
      res.write(`data: ${JSON.stringify({ error: 'AI service unavailable' })}\n\n`);
      res.end();
      return;
    }

    try {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        temperature: 0.2,
        stream: true,
        messages: [
          { role: 'system', content: params.systemPrompt },
          { role: 'user', content: params.userPrompt },
        ],
      });

      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content;
        if (token) {
          res.write(`data: ${JSON.stringify({ token })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
    } catch (error) {
      const statusCode =
        typeof error === 'object' && error !== null && 'status' in error
          ? (error as { status?: number }).status
          : undefined;

      const message =
        statusCode === 429
          ? 'AI service rate limited. Please try again later.'
          : 'Failed to generate AI analysis response';

      this.logger.error(`[OpenAI] stream failed: ${error instanceof Error ? error.message : 'unknown'}`);
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    } finally {
      res.end();
    }
  }

  private handleOpenAiError(error: unknown): never {
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