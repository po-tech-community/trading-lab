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
}
