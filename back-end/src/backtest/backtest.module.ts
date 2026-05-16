import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PriceService } from './price.service';
import { BacktestController } from './backtest.controller';
import { CalculationService } from './calculation.service';
import { BacktestHistoryController } from './backtest-history.controller';
import { BacktestHistoryService } from './backtest-history.service';
import { BacktestHistory, BacktestHistorySchema } from './schemas/backtest-history.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BacktestHistory.name, schema: BacktestHistorySchema },
    ]),
  ],
  controllers: [BacktestController, BacktestHistoryController],
  providers: [PriceService, CalculationService, BacktestHistoryService],
  exports: [PriceService, CalculationService],
})
export class BacktestModule {}
