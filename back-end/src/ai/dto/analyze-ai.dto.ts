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

class BacktestTimelinePointDto {
  @ApiProperty({ example: '2026-04-20' })
  @IsString()
  date: string;

  @ApiProperty({ example: 1200.11 })
  @IsNumber()
  value: number;
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
