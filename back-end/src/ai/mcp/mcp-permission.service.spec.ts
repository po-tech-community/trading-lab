import { ConfigService } from '@nestjs/config';
import { McpConfigService } from './mcp-config.service';
import { McpPermissionService } from './mcp-permission.service';

describe('McpPermissionService', () => {
  function createService(overrides?: Record<string, string>) {
    const configService = {
      get: jest.fn((key: string, fallback?: string) => overrides?.[key] ?? fallback),
    } as unknown as ConfigService;

    return new McpPermissionService(new McpConfigService(configService));
  }

  it('allows read-only tools by default', () => {
    const service = createService();
    const result = service.evaluateTool({
      providerId: 'market',
      providerName: 'Market',
      name: 'latest_quote',
      readOnly: true,
      destructive: false,
    });

    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('read_only_default_allow');
  });

  it('denies destructive tools by default', () => {
    const service = createService();
    const result = service.evaluateTool({
      providerId: 'market',
      providerName: 'Market',
      name: 'place_trade',
      readOnly: false,
      destructive: true,
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('destructive_default_deny');
  });

  it('lets deny list override allow list and defaults', () => {
    const service = createService({
      MCP_ALLOW_TOOLS: 'market.latest_quote',
      MCP_DENY_TOOLS: 'market.latest_quote',
    });
    const result = service.evaluateTool({
      providerId: 'market',
      providerName: 'Market',
      name: 'latest_quote',
      readOnly: true,
      destructive: false,
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('deny_list');
  });
});
