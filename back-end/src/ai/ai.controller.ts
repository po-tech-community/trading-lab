import { Body, Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  AnalyzeAiDto,
  AnalyzeAiResponse,
  McpExecuteDto,
  McpInspectDto,
  McpInspectResponse,
} from './dto/analyze-ai.dto';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AiRateLimitGuard } from './guards/ai-rate-limit.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import type { Response } from 'express';

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard, AiRateLimitGuard)
export class AiController {
  constructor(private readonly aiService: AiService) { }

  @Post('analyze')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Analyze a backtest context and answer user question',
  })
  @ApiBody({ type: AnalyzeAiDto })
  @ApiResponse({
    status: 201,
    description: 'AI analysis generated successfully',
    schema: {
      example: {
        advice:
          'Your stop-loss appears too tight for recent volatility. Consider widening it and comparing weekly frequency.',
        suggestedActions: [
          'Compare weekly vs monthly frequency',
          'Lower sellAction by 10%',
        ],
        evidence: [
          {
            source: 'mcp',
            providerId: 'backtest-context',
            providerName: 'Backtest Context Provider',
            toolName: 'evaluate_risk_profile',
            status: 'executed',
            input: {
              backtestContext: {
                mode: 'portfolio',
              },
            },
            summary:
              'Risk check classified the sample as medium risk because drawdown was elevated while returns stayed positive.',
            structuredContent: {
              riskLevel: 'medium',
              sampledDrawdownPercent: 11.2,
            },
          },
        ],
        mcp: {
          enabled: true,
          status: 'ready',
          fallbackStrategy: 'llm_only',
          timeoutMs: 8000,
          retryAttempts: 2,
          providers: [
            {
              providerId: 'market-snapshot',
              providerName: 'Market Snapshot Provider',
              transport: 'streamable-http',
              status: 'ready',
              attempts: 1,
              discoveredTools: 2,
            },
          ],
          tools: [
            {
              providerId: 'market-snapshot',
              name: 'latest_quote',
              readOnly: true,
              destructive: false,
              allowed: true,
              permissionReason: 'read_only_default_allow',
            },
          ],
          audit: {
            scope: 'mcp_audit',
            actorUserId: 'user_123',
            occurredAt: '2026-04-26T12:00:00.000Z',
            fallbackUsed: false,
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 429,
    description: 'Too many AI analyze requests. Please retry later.',
  })
  async analyze(
    @Body() body: AnalyzeAiDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<AnalyzeAiResponse> {
    return this.aiService.analyze(body, {
      userId: user.sub,
      email: user.email,
    });
  }

  /**
   * GET /ai/analyze/stream
   *
   * Server-Sent Events (SSE) alternative to POST /ai/analyze.
   * The request body is passed as a URL-encoded JSON string in the `payload`
   * query parameter so that the browser EventSource API (GET-only) can be used.
   *
   * Event stream format:
   *   data: {"meta":{suggestedActions, evidence, mcp}}\n\n  — emitted once before tokens
   *   data: {"token":"<chunk>"}\n\n                          — one per LLM token
   *   data: [DONE]\n\n                                       — stream finished
   *   data: {"error":"<message>"}\n\n                        — on error (then closes)
   */
  @Get('analyze/stream')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Stream AI analysis tokens via Server-Sent Events',
    description:
      'Pass the AnalyzeAiDto JSON as the `payload` query-string parameter. ' +
      'The endpoint emits a `meta` event first, then individual `token` events, ' +
      'and finally `[DONE]`.',
  })
  @ApiQuery({
    name: 'payload',
    description: 'URL-encoded JSON matching AnalyzeAiDto',
    required: true,
    type: String,
  })
  @ApiResponse({ status: 200, description: 'SSE stream opened' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many AI analyze requests. Please retry later.' })
  async analyzeStream(
    @Query('payload') payload: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ): Promise<void> {
    // Set SSE headers before any write
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering if present
    res.flushHeaders();

    let body: AnalyzeAiDto;
    try {
      body = JSON.parse(decodeURIComponent(payload)) as AnalyzeAiDto;
    } catch {
      res.write(`data: ${JSON.stringify({ error: 'Invalid payload JSON' })}\n\n`);
      res.end();
      return;
    }

    await this.aiService.analyzeStream(body, { userId: user.sub, email: user.email }, res);
  }

  @Post('mcp/inspect')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Discover MCP tools and preview execution plan — no tools are run',
    description:
      'Returns the list of MCP tools that would be invoked for this query, ' +
      'along with permission decisions. Use the returned plannedTools to build ' +
      'the approval UI, then call POST /ai/mcp/execute with the approved subset.',
  })
  @ApiBody({ type: McpInspectDto })
  @ApiResponse({
    status: 201,
    description: 'Tool inspection completed. No tools were executed.',
    schema: {
      example: {
        trace: {
          enabled: true,
          status: 'ready',
          fallbackStrategy: 'llm_only',
          timeoutMs: 8000,
          retryAttempts: 2,
          providers: [],
          tools: [],
          audit: { scope: 'mcp_audit', actorUserId: 'user_123', occurredAt: '2026-05-10T00:00:00.000Z', fallbackUsed: false },
        },
        plannedTools: [
          {
            providerId: 'backtest-context',
            providerName: 'Backtest Context Provider',
            toolName: 'evaluate_risk_profile',
            title: 'Evaluate Risk Profile',
            description: 'Classifies this run as low/medium/high risk.',
            readOnly: true,
            destructive: false,
            input: { backtestContext: { mode: 'single' } },
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many AI analyze requests. Please retry later.' })
  async inspect(
    @Body() body: McpInspectDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<McpInspectResponse> {
    return this.aiService.inspect(body, {
      userId: user.sub,
      email: user.email,
    });
  }

  @Post('mcp/execute')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Execute user-approved MCP tools and return AI advice with evidence',
    description:
      'Runs only the tools listed in approvedTools (a subset of what ' +
      'POST /ai/mcp/inspect returned). Denied tools are skipped. ' +
      'Returns the same shape as POST /ai/analyze.',
  })
  @ApiBody({ type: McpExecuteDto })
  @ApiResponse({
    status: 201,
    description: 'AI advice generated from approved MCP tool evidence.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many AI analyze requests. Please retry later.' })
  async executeApproved(
    @Body() body: McpExecuteDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<AnalyzeAiResponse> {
    return this.aiService.executeApproved(body, {
      userId: user.sub,
      email: user.email,
    });
  }
}