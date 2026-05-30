export type McpTransportType = 'streamable-http' | 'sse' | 'stdio';

export type McpFallbackStrategy = 'llm_only' | 'skip_provider';

export interface McpProviderConfig {
  id: string;
  name: string;
  enabled: boolean;
  transport: McpTransportType;
  url?: string;
  command?: string;
  args?: string[];
  cwd?: string;
  headers?: Record<string, string>;
  env?: Record<string, string>;
}

export interface McpRuntimeConfig {
  enabled: boolean;
  timeoutMs: number;
  retryAttempts: number;
  retryBackoffMs: number;
  fallbackStrategy: McpFallbackStrategy;
  allowTools: string[];
  denyTools: string[];
  providers: McpProviderConfig[];
  clientName: string;
  clientVersion: string;
}

export interface McpDiscoveredTool {
  providerId: string;
  providerName: string;
  name: string;
  title?: string;
  description?: string;
  readOnly: boolean;
  destructive: boolean;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

export interface McpProviderDiscoveryTrace {
  providerId: string;
  providerName: string;
  transport: McpTransportType;
  status: 'ready' | 'failed' | 'skipped';
  attempts: number;
  discoveredTools: number;
  error?: string;
}

export interface McpPermissionDecision {
  providerId: string;
  toolName: string;
  allowed: boolean;
  reason:
    | 'allow_list'
    | 'deny_list'
    | 'read_only_default_allow'
    | 'destructive_default_deny';
}

export interface McpAuditMetadata {
  scope: 'mcp_audit';
  actorUserId: string;
  actorEmail?: string;
  occurredAt: string;
  fallbackUsed: boolean;
}

export interface McpInspectionTrace {
  enabled: boolean;
  status: 'disabled' | 'no_providers' | 'ready' | 'fallback';
  fallbackStrategy: McpFallbackStrategy;
  fallbackReason?: string;
  timeoutMs: number;
  retryAttempts: number;
  providers: McpProviderDiscoveryTrace[];
  tools: Array<
    McpDiscoveredTool & {
      allowed: boolean;
      permissionReason: McpPermissionDecision['reason'];
    }
  >;
  audit: McpAuditMetadata;
}

export interface McpExecutionEvidence {
  source: 'mcp';
  providerId: string;
  providerName: string;
  toolName: string;
  title?: string;
  status: 'executed' | 'failed';
  input: Record<string, unknown>;
  summary: string;
  structuredContent?: Record<string, unknown>;
  error?: string;
}

export interface McpExecutionBundle {
  trace: McpInspectionTrace;
  evidence: McpExecutionEvidence[];
}

export interface McpPlannedTool {
  providerId: string;
  providerName: string;
  toolName: string;
  title?: string;
  description?: string;
  readOnly: boolean;
  destructive: boolean;
  input: Record<string, unknown>;
}

export interface McpInspectBundle {
  trace: McpInspectionTrace;
  plannedTools: McpPlannedTool[];
}
