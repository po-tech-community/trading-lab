import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PriceService } from './price.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('backtest')
@Controller('backtest')
@Public()
export class BacktestController {
    constructor(private readonly priceService: PriceService) { }

    @Get('test-prices')
    testPrices(
        @Query('symbol') symbol: string,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ) {
        return this.priceService.fetchPrices(symbol, startDate, endDate);
    }
}