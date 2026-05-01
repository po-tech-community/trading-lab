import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AnalyzeAiDto, AnalyzeAiResponse } from './dto/analyze-ai.dto';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AiRateLimitGuard } from './guards/ai-rate-limit.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard, AiRateLimitGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

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
}
