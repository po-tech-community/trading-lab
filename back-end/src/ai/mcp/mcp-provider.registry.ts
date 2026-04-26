import { Injectable } from '@nestjs/common';
import { McpConfigService } from './mcp-config.service';
import { McpProviderConfig } from './mcp.types';

@Injectable()
export class McpProviderRegistry {
  constructor(private readonly mcpConfigService: McpConfigService) {}

  listProviders(): McpProviderConfig[] {
    return this.mcpConfigService.getRuntimeConfig().providers;
  }

  listEnabledProviders(): McpProviderConfig[] {
    return this.listProviders().filter((provider) => provider.enabled);
  }
}

