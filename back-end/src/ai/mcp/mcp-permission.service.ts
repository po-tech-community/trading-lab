import { Injectable } from '@nestjs/common';
import { McpConfigService } from './mcp-config.service';
import {
  McpDiscoveredTool,
  McpPermissionDecision,
  McpRuntimeConfig,
} from './mcp.types';

@Injectable()
export class McpPermissionService {
  constructor(private readonly mcpConfigService: McpConfigService) {}

  evaluateTool(tool: McpDiscoveredTool): McpPermissionDecision {
    const config = this.mcpConfigService.getRuntimeConfig();
    const names = this.getComparableNames(tool);

    if (this.matchesList(names, config.denyTools)) {
      return {
        providerId: tool.providerId,
        toolName: tool.name,
        allowed: false,
        reason: 'deny_list',
      };
    }

    if (this.matchesList(names, config.allowTools)) {
      return {
        providerId: tool.providerId,
        toolName: tool.name,
        allowed: true,
        reason: 'allow_list',
      };
    }

    if (tool.readOnly && !tool.destructive) {
      return {
        providerId: tool.providerId,
        toolName: tool.name,
        allowed: true,
        reason: 'read_only_default_allow',
      };
    }

    return {
      providerId: tool.providerId,
      toolName: tool.name,
      allowed: false,
      reason: 'destructive_default_deny',
    };
  }

  getPolicySnapshot(): Pick<McpRuntimeConfig, 'allowTools' | 'denyTools'> {
    const config = this.mcpConfigService.getRuntimeConfig();
    return {
      allowTools: config.allowTools,
      denyTools: config.denyTools,
    };
  }

  private getComparableNames(tool: McpDiscoveredTool): string[] {
    return [
      tool.name.toLowerCase(),
      `${tool.providerId}.${tool.name}`.toLowerCase(),
      `${tool.providerName}.${tool.name}`.toLowerCase(),
    ];
  }

  private matchesList(candidates: string[], policyList: string[]): boolean {
    const normalizedList = policyList.map((entry) => entry.toLowerCase());
    return candidates.some((candidate) => normalizedList.includes(candidate));
  }
}

