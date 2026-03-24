/**
 * Backtest feature MODULE – price service, calculation engine, backtest API.
 *
 * Level 1: PriceService (fetch historical prices from CoinGecko / AlphaVantage)
 * Level 1: CalculationService (DCA simulation engine) – coming next
 * Level 1: BacktestController (POST /backtest/run) – coming next
 *
 * @see doc/developer-tasks.md L1-BE-1, L1-BE-2, L1-BE-3
 */

import { Module } from '@nestjs/common';
import { PriceService } from './price.service';

@Module({
    providers: [PriceService],
    exports: [PriceService],
})
export class BacktestModule { }
