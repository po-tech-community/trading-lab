import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PriceService } from './price.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('backtest')
@Controller('backtest')
@Public()
export class BacktestController {
    constructor(private readonly priceService: PriceService) { }

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
    @ApiResponse({ status: 400, description: 'Invalid symbol, or no data found for the given date range' })
    @ApiResponse({ status: 500, description: 'Price provider API error or rate limit reached' })
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
}
