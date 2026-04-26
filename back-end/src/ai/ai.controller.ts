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
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 429,
    description: 'Too many AI analyze requests. Please retry later.',
  })
  async analyze(@Body() body: AnalyzeAiDto): Promise<AnalyzeAiResponse> {
    return this.aiService.analyze(body);
  }
}
