import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

class BacktestSummaryContextDto {
  @ApiProperty({ example: 1200.5 })
  @IsNumber()
  totalInvested: number;

  @ApiProperty({ example: 1345.21 })
  @IsNumber()
  currentValue: number;

  @ApiProperty({ example: 12.06 })
  @IsNumber()
  totalReturnPercentage: number;

  @ApiPropertyOptional({ example: 52.12 })
  @IsOptional()
  @IsNumber()
  realizedProfit?: number;

  @ApiPropertyOptional({ example: 93.33 })
  @IsOptional()
  @IsNumber()
  unrealizedValue?: number;
}

class BacktestContextSnapshotDto {
  @ApiProperty({ enum: ['single', 'portfolio'] })
  @IsIn(['single', 'portfolio'])
  mode: 'single' | 'portfolio';

  @ApiProperty({ example: 'Portfolio Backtest (BTC, ETH)' })
  @IsString()
  @MaxLength(120)
  title: string;

  @ApiProperty({
    example: '2026-04-24T12:30:00.000Z',
    description: 'ISO timestamp when the snapshot was captured',
  })
  @IsString()
  generatedAt: string;

  @ApiProperty({ type: BacktestSummaryContextDto })
  @ValidateNested()
  @Type(() => BacktestSummaryContextDto)
  summary: BacktestSummaryContextDto;

  @ApiPropertyOptional({
    type: 'array',
    description:
      'Optional asset weights for portfolio-aware MCP diagnostics such as concentration risk.',
    example: [
      { symbol: 'BTC', weight: 0.6 },
      { symbol: 'ETH', weight: 0.4 },
    ],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BacktestAssetWeightContextDto)
  assets?: BacktestAssetWeightContextDto[];

  @ApiPropertyOptional({
    type: 'array',
    description: 'Sampled trades to help explain drawdowns and exits',
    example: [
      {
        date: '2026-04-20T08:00:00.000Z',
        type: 'SELL',
        price: 68250.5,
        profit: 12.4,
      },
    ],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BacktestTradeContextDto)
  trades?: BacktestTradeContextDto[];

  @ApiPropertyOptional({
    type: 'array',
    description: 'Recent timeline sample (usually last 5-10 points)',
    example: [
      { date: '2026-04-20', value: 1200.11 },
      { date: '2026-04-21', value: 1192.45 },
    ],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BacktestTimelinePointDto)
  timelineSample?: BacktestTimelinePointDto[];
}

class BacktestTradeContextDto {
  @ApiProperty({ example: '2026-04-20T08:00:00.000Z' })
  @IsString()
  date: string;

  @ApiProperty({ example: 'SELL' })
  @IsString()
  @MaxLength(20)
  type: string;

  @ApiProperty({ example: 68250.5 })
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ example: 12.4 })
  @IsOptional()
  @IsNumber()
  profit?: number;
}

class BacktestAssetWeightContextDto {
  @ApiProperty({ example: 'BTC' })
  @IsString()
  symbol: string;

  @ApiProperty({
    example: 0.6,
    description: 'Portfolio weight expressed as a ratio from 0 to 1.',
  })
  @IsNumber()
  weight: number;
}

class BacktestTimelinePointDto {
  @ApiProperty({ example: '2026-04-20' })
  @IsString()
  date: string;

  @ApiProperty({ example: 1200.11 })
  @IsNumber()
  value: number;
}

class AnalyzeAiMcpProviderDto {
  @ApiProperty({ example: 'market-snapshot' })
  providerId: string;

  @ApiProperty({ example: 'Market Snapshot Provider' })
  providerName: string;

  @ApiProperty({ enum: ['streamable-http', 'sse', 'stdio'] })
  transport: 'streamable-http' | 'sse' | 'stdio';

  @ApiProperty({ enum: ['ready', 'failed', 'skipped'] })
  status: 'ready' | 'failed' | 'skipped';

  @ApiProperty({ example: 1 })
  attempts: number;

  @ApiProperty({ example: 3 })
  discoveredTools: number;

  @ApiPropertyOptional({ example: 'Timed out after 8000ms.' })
  error?: string;
}

class AnalyzeAiMcpToolDto {
  @ApiProperty({ example: 'market-snapshot' })
  providerId: string;

  @ApiProperty({ example: 'latest_quote' })
  name: string;

  @ApiPropertyOptional({ example: 'Latest Quote' })
  title?: string;

  @ApiPropertyOptional({ example: 'Returns the latest market quote.' })
  description?: string;

  @ApiProperty({ example: true })
  readOnly: boolean;

  @ApiProperty({ example: false })
  destructive: boolean;

  @ApiProperty({ example: true })
  allowed: boolean;

  @ApiProperty({
    enum: [
      'allow_list',
      'deny_list',
      'read_only_default_allow',
      'destructive_default_deny',
    ],
  })
  permissionReason:
    | 'allow_list'
    | 'deny_list'
    | 'read_only_default_allow'
    | 'destructive_default_deny';
}

class AnalyzeAiMcpAuditDto {
  @ApiProperty({ example: 'mcp_audit' })
  scope: 'mcp_audit';

  @ApiProperty({ example: 'user_123' })
  actorUserId: string;

  @ApiPropertyOptional({ example: 'trader@example.com' })
  actorEmail?: string;

  @ApiProperty({ example: '2026-04-26T12:00:00.000Z' })
  occurredAt: string;

  @ApiProperty({ example: false })
  fallbackUsed: boolean;
}

class AnalyzeAiMcpTraceDto {
  @ApiProperty({ example: true })
  enabled: boolean;

  @ApiProperty({ enum: ['disabled', 'no_providers', 'ready', 'fallback'] })
  status: 'disabled' | 'no_providers' | 'ready' | 'fallback';

  @ApiProperty({ enum: ['llm_only', 'skip_provider'] })
  fallbackStrategy: 'llm_only' | 'skip_provider';

  @ApiPropertyOptional({
    example: 'No enabled MCP providers were configured.',
  })
  fallbackReason?: string;

  @ApiProperty({ example: 8000 })
  timeoutMs: number;

  @ApiProperty({ example: 2 })
  retryAttempts: number;

  @ApiProperty({ type: [AnalyzeAiMcpProviderDto] })
  providers: AnalyzeAiMcpProviderDto[];

  @ApiProperty({ type: [AnalyzeAiMcpToolDto] })
  tools: AnalyzeAiMcpToolDto[];

  @ApiProperty({ type: AnalyzeAiMcpAuditDto })
  audit: AnalyzeAiMcpAuditDto;
}

class AnalyzeAiEvidenceDto {
  @ApiProperty({ example: 'mcp' })
  source: 'mcp';

  @ApiProperty({ example: 'market-snapshot' })
  providerId: string;

  @ApiProperty({ example: 'Market Snapshot Provider' })
  providerName: string;

  @ApiProperty({ example: 'get_latest_quote' })
  toolName: string;

  @ApiPropertyOptional({ example: 'Latest Quote' })
  title?: string;

  @ApiProperty({ enum: ['executed', 'failed'] })
  status: 'executed' | 'failed';

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: { symbol: 'BTC' },
  })
  input: Record<string, unknown>;

  @ApiProperty({
    example: 'BTC latest quote shows price 68420.15 USD with 1.82% 24h change.',
  })
  summary: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
  })
  structuredContent?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'Timed out after 8000ms.' })
  error?: string;
}

export class AnalyzeAiDto {
  @ApiProperty({
    example: 'Why did this portfolio underperform and what should I test next?',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  userQuery: string;

  @ApiPropertyOptional({ type: BacktestContextSnapshotDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BacktestContextSnapshotDto)
  backtestContext?: BacktestContextSnapshotDto;
}

export interface AnalyzeAiResponse {
  advice: string;
  suggestedActions?: string[];
  mcp?: AnalyzeAiMcpTraceDto;
  evidence?: AnalyzeAiEvidenceDto[];
}
