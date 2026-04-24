import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { AnalyzeAiDto, AnalyzeAiResponse } from './dto/analyze-ai.dto';
import { AiService } from './ai.service';

@ApiTags('ai')
@Controller('ai')
@Public()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('analyze')
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
  async analyze(@Body() body: AnalyzeAiDto): Promise<AnalyzeAiResponse> {
    return this.aiService.analyze(body);
  }
}
