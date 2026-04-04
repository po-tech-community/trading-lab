import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsIn,
    IsInt,
    IsNumber,
    IsPositive,
    IsString,
    IsUppercase,
    ValidateNested,
} from 'class-validator';
import { DCA_FREQUENCIES, type DcaFrequency } from './dca-frequency';

/**
 * One asset entry in the portfolio request.
 * `weight` is a percentage (e.g. 60 means 60%). All weights must sum to 100.
 */
export class PortfolioAssetDto {
    @ApiProperty({ example: 'BTC', description: 'Asset symbol (e.g. BTC, ETH, AAPL, TSLA)' })
    @IsString()
    @IsUppercase({ message: 'Symbol must be uppercase (e.g. BTC, ETH, AAPL, TSLA)' })
    symbol: string;

    @ApiProperty({ example: 60, description: 'Weight percentage for this asset (e.g. 60 = 60%). All weights must sum to 100.' })
    @Type(() => Number)
    @IsNumber()
    @IsPositive({ message: 'Weight must be greater than 0' })
    weight: number;
}

/**
 * Request body for POST /api/v1/backtest/portfolio.
 * Weights across all assets must sum to exactly 100%.
 *
 * @see doc/developer-tasks.md L2-BE-3
 */
export class RunPortfolioDcaBacktestDto {
    @ApiProperty({
        type: [PortfolioAssetDto],
        description: 'List of assets with their percentage weights. Weights must sum to 100.',
        example: [
            { symbol: 'BTC', weight: 60 },
            { symbol: 'ETH', weight: 40 },
        ],
    })
    @IsArray()
    @ArrayMinSize(1, { message: 'Portfolio must include at least one asset.' })
    @ValidateNested({ each: true })
    @Type(() => PortfolioAssetDto)
    assets: PortfolioAssetDto[];

    @ApiProperty({ example: 100, description: 'Total amount to invest per period in USD (must be > 0)' })
    @Type(() => Number)
    @IsNumber()
    @IsPositive({ message: 'totalAmount must be greater than 0' })
    totalAmount: number;

    @ApiProperty({ enum: DCA_FREQUENCIES, example: 'weekly' })
    @IsIn(DCA_FREQUENCIES, {
        message: 'Frequency must be one of: daily, weekly, monthly',
    })
    frequency: DcaFrequency;

    @ApiProperty({
        example: 1746057600000,
        description:
            'Start date as epoch milliseconds (UTC midnight). ' +
            'For BTC/ETH must be within the past 365 days (CoinGecko free tier limit).',
    })
    @Type(() => Number)
    @IsNumber()
    @IsInt()
    startDate: number;

    @ApiProperty({
        example: 1748736000000,
        description: 'End date as epoch milliseconds (UTC midnight). Must be after startDate.',
    })
    @Type(() => Number)
    @IsNumber()
    @IsInt()
    endDate: number;
}
