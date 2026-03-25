import { Controller, Get, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { PriceService } from './price.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('backtest')
@Controller('backtest')
@Public()
export class BacktestController {
    constructor(private readonly priceService: PriceService) { }

    @Get('test-prices')
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
