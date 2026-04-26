import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  McpFallbackStrategy,
  McpProviderConfig,
  McpRuntimeConfig,
} from './mcp.types';

@Injectable()
export class McpConfigService {
  private readonly logger = new Logger(McpConfigService.name);

  constructor(private readonly configService: ConfigService) {}

  getRuntimeConfig(): McpRuntimeConfig {
    return {
      enabled: this.configService.get<string>('MCP_ENABLED', 'true') === 'true',
      timeoutMs: this.getNumber('MCP_TIMEOUT_MS', 8_000),
      retryAttempts: this.getNumber('MCP_RETRY_ATTEMPTS', 2),
      retryBackoffMs: this.getNumber('MCP_RETRY_BACKOFF_MS', 250),
      fallbackStrategy: this.getFallbackStrategy(),
      allowTools: this.getCsvList('MCP_ALLOW_TOOLS'),
      denyTools: this.getCsvList('MCP_DENY_TOOLS'),
      providers: this.getProviders(),
      clientName: this.configService.get<string>(
        'MCP_CLIENT_NAME',
        'trading-lab-ai',
      ),
      clientVersion: this.configService.get<string>(
        'MCP_CLIENT_VERSION',
        '1.0.0',
      ),
    };
  }

  private getNumber(key: string, fallback: number): number {
    const raw = this.configService.get<string>(key);
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  private getFallbackStrategy(): McpFallbackStrategy {
    const value = this.configService.get<string>(
      'MCP_FALLBACK_STRATEGY',
      'llm_only',
    );
    return value === 'skip_provider' ? 'skip_provider' : 'llm_only';
  }

  private getCsvList(key: string): string[] {
    const raw = this.configService.get<string>(key, '');
    return raw
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }

  private getProviders(): McpProviderConfig[] {
    const raw = this.configService.get<string>('MCP_PROVIDERS', '[]');

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        this.logger.warn('MCP_PROVIDERS is not an array. Ignoring value.');
        return [];
      }

      return parsed
        .map((provider, index) => this.normalizeProvider(provider, index))
        .filter((provider): provider is McpProviderConfig => provider !== null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown JSON parse error';
      this.logger.warn(`Failed to parse MCP_PROVIDERS: ${message}`);
      return [];
    }
  }

  private normalizeProvider(
    provider: unknown,
    index: number,
  ): McpProviderConfig | null {
    if (!provider || typeof provider !== 'object') {
      return null;
    }

    const candidate = provider as Record<string, unknown>;
    const transport = candidate.transport;
    if (
      transport !== 'streamable-http' &&
      transport !== 'sse' &&
      transport !== 'stdio'
    ) {
      return null;
    }

    const id =
      typeof candidate.id === 'string' && candidate.id.trim().length > 0
        ? candidate.id.trim()
        : `provider-${index + 1}`;
    const name =
      typeof candidate.name === 'string' && candidate.name.trim().length > 0
        ? candidate.name.trim()
        : id;
    const enabled =
      typeof candidate.enabled === 'boolean' ? candidate.enabled : true;

    return {
      id,
      name,
      enabled,
      transport,
      url: typeof candidate.url === 'string' ? candidate.url : undefined,
      command:
        typeof candidate.command === 'string' ? candidate.command : undefined,
      args: Array.isArray(candidate.args)
        ? candidate.args.filter(
            (value): value is string => typeof value === 'string',
          )
        : undefined,
      cwd: typeof candidate.cwd === 'string' ? candidate.cwd : undefined,
      headers: this.normalizeStringMap(candidate.headers),
      env: this.normalizeStringMap(candidate.env),
    };
  }

  private normalizeStringMap(
    value: unknown,
  ): Record<string, string> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }

    const entries = Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    );

    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  }
}

