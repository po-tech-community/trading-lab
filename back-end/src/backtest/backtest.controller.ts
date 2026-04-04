import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CalculationService } from './calculation.service';
import { RunDcaBacktestDto } from './dto/run-dca-backtest.dto';
import { RunPortfolioDcaBacktestDto } from './dto/run-portfolio-backtest.dto';
import { PriceService } from './price.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('backtest')
@Controller('backtest')
@Public()
export class BacktestController {
  constructor(
    private readonly priceService: PriceService,
    private readonly calculationService: CalculationService,
  ) {}

  @ApiOperation({ summary: 'Run DCA backtest for single asset' })
  @Post('run')
  @ApiBody({ type: RunDcaBacktestDto })
  async run(@Body() body: RunDcaBacktestDto) {
    const { symbol, amount, frequency, startDate, endDate } = body;
    const prices = await this.priceService.fetchPrices(
      symbol,
      startDate,
      endDate,
    );
    return this.calculationService.runSingleAssetDcaBacktest(prices, {
      amount,
      frequency,
      startDate,
      endDate,
    });
  }

  @Get('test-prices')
  @ApiOperation({
    summary: 'Fetch historical close prices for a symbol',
    description:
      'Returns daily close prices for the given symbol and date range. ' +
      'Crypto (BTC, ETH) uses CoinGecko — free tier is limited to the past 365 days only. ' +
      'Stocks (AAPL, TSLA) use AlphaVantage — free tier also returns the last 365 trading days only.',
  })
  @ApiQuery({ name: 'symbol', example: 'BTC' })
  @ApiQuery({
    name: 'startDate',
    example: '1746057600000',
    description: 'Start date as epoch milliseconds',
  })
  @ApiQuery({
    name: 'endDate',
    example: '1748736000000',
    description: 'End date as epoch milliseconds',
  })
  @ApiResponse({ status: 200, description: 'Returned successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid symbol, or no data found for the given date range',
  })
  @ApiResponse({
    status: 500,
    description: 'Price provider API error or rate limit reached',
  })
  testPrices(
    @Query('symbol') symbol: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.priceService.fetchPrices(
      symbol,
      parseInt(startDate),
      parseInt(endDate),
    );
  }
  // ---------------------------------------------------------------------------
  // POST /backtest/portfolio — L2-BE-3
  // ---------------------------------------------------------------------------

  /**
   * Portfolio DCA backtest endpoint.
   *
   * Flow:
   * 1. Validate request body (weights sum, amounts, dates) via ValidationPipe + DTO
   * 2. Validate endDate > startDate manually (cross-field rule)
   * 3. Fetch price series for all symbols in parallel via PriceService
   * 4. Run portfolio DCA simulation via CalculationService
   * 5. Return { summary, timeline } — assetBreakdown is inside summary.assets
   *
   * @see doc/developer-tasks.md L2-BE-3
   */
  @Post('portfolio')
  @ApiOperation({
    summary: 'Run a multi-asset portfolio DCA backtest',
    description:
      'Simulates recurring investments across multiple assets by weight. ' +
      'Asset weights must sum to exactly 100%. ' +
      'Each period the totalAmount is split by weight and invested in each asset. ' +
      'Crypto (BTC, ETH) dates must be within the past 365 days (CoinGecko free tier limit).',
  })
  @ApiBody({ type: RunPortfolioDcaBacktestDto })
  @ApiResponse({
    status: 201,
    description:
      'Backtest completed. Returns summary (with per-asset breakdown) and timeline.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Validation error: weights do not sum to 100, invalid symbol, endDate before startDate, or no price data in range.',
  })
  @ApiResponse({
    status: 500,
    description: 'Price provider API error or rate limit reached.',
  })
  async runPortfolio(@Body() dto: RunPortfolioDcaBacktestDto) {
    if (dto.endDate <= dto.startDate) {
      throw new BadRequestException('endDate must be after startDate.');
    }

    // Fetch price series for all symbols in parallel
    const symbols = dto.assets.map((a) => a.symbol);
    const seriesBySymbol = await this.priceService.fetchPricesForSymbols(
      symbols,
      dto.startDate,
      dto.endDate,
    );

    // Run the portfolio DCA simulation
    const result = this.calculationService.runPortfolioDcaBacktest(
      seriesBySymbol,
      {
        assets: dto.assets,
        totalAmount: dto.totalAmount,
        frequency: dto.frequency,
        startDate: dto.startDate,
        endDate: dto.endDate,
      },
    );

    return {
      ...result,
      assetBreakdown: result.summary.assets,
    };
  }
}
