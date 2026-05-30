import {
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmService } from './llm.service';

const createCompletionMock = jest.fn();

jest.mock('openai', () =>
  jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: createCompletionMock,
      },
    },
  })),
);

describe('LlmService', () => {
  const prompt = {
    systemPrompt: 'system',
    userPrompt: 'user',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws ServiceUnavailableException when OPENAI_API_KEY is missing', async () => {
    const configService = {
      get: jest.fn((key: string, fallback?: string) => {
        if (key === 'OPENAI_API_KEY') return undefined;
        return fallback;
      }),
    } as unknown as ConfigService;

    const service = new LlmService(configService);

    await expect(service.generateAdvice(prompt)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('maps provider 429 to HttpException(429)', async () => {
    createCompletionMock.mockRejectedValueOnce({ status: 429 });
    const configService = {
      get: jest.fn((key: string, fallback?: string) => {
        if (key === 'OPENAI_API_KEY') return 'fake-key';
        return fallback;
      }),
    } as unknown as ConfigService;

    const service = new LlmService(configService);

    await service.generateAdvice(prompt).catch((error) => {
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    });
  });

  it('throws InternalServerErrorException when provider fails unexpectedly', async () => {
    createCompletionMock.mockRejectedValueOnce(new Error('network down'));
    const configService = {
      get: jest.fn((key: string, fallback?: string) => {
        if (key === 'OPENAI_API_KEY') return 'fake-key';
        return fallback;
      }),
    } as unknown as ConfigService;

    const service = new LlmService(configService);

    await expect(service.generateAdvice(prompt)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('throws InternalServerErrorException when provider returns empty content', async () => {
    createCompletionMock.mockResolvedValueOnce({
      choices: [{ message: { content: '   ' } }],
    });
    const configService = {
      get: jest.fn((key: string, fallback?: string) => {
        if (key === 'OPENAI_API_KEY') return 'fake-key';
        return fallback;
      }),
    } as unknown as ConfigService;

    const service = new LlmService(configService);

    await expect(service.generateAdvice(prompt)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
