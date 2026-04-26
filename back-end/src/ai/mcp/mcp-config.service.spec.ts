import { ConfigService } from '@nestjs/config';
import { McpConfigService } from './mcp-config.service';

describe('McpConfigService', () => {
  it('returns sensible defaults when env vars are missing', () => {
    const configService = {
      get: jest.fn((_key: string, fallback?: string) => fallback),
    } as unknown as ConfigService;

    const service = new McpConfigService(configService);
    const config = service.getRuntimeConfig();

    expect(config.enabled).toBe(true);
    expect(config.timeoutMs).toBe(8000);
    expect(config.retryAttempts).toBe(2);
    expect(config.fallbackStrategy).toBe('llm_only');
    expect(config.providers).toEqual([]);
  });

  it('parses provider definitions from MCP_PROVIDERS JSON', () => {
    const configService = {
      get: jest.fn((key: string, fallback?: string) => {
        if (key === 'MCP_PROVIDERS') {
          return JSON.stringify([
            {
              id: 'market',
              name: 'Market Provider',
              transport: 'streamable-http',
              url: 'https://example.com/mcp',
              headers: { Authorization: 'Bearer token' },
            },
          ]);
        }
        return fallback;
      }),
    } as unknown as ConfigService;

    const service = new McpConfigService(configService);
    const config = service.getRuntimeConfig();

    expect(config.providers).toHaveLength(1);
    expect(config.providers[0]).toMatchObject({
      id: 'market',
      name: 'Market Provider',
      transport: 'streamable-http',
      url: 'https://example.com/mcp',
    });
  });
});

