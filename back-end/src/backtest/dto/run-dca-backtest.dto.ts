import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsPositive, IsString, Validate } from 'class-validator';
import { SUPPORTED_BACKTEST_SYMBOLS } from '../supported-symbols';
import { DCA_FREQUENCIES, type DcaFrequency } from './dca-frequency';
import { IsEndAfterStartConstraint } from './is-end-after-start.constraint';

/** Plain input shape for the calculation engine (validated via {@link RunDcaBacktestDto} at the HTTP boundary). */
export interface RunDcaBacktestParams {
  amount: number;
  frequency: DcaFrequency;
  startDate: number;
  endDate: number;
}

export class RunDcaBacktestDto implements RunDcaBacktestParams {
  @ApiProperty({
    example: 'BTC',
    enum: SUPPORTED_BACKTEST_SYMBOLS,
    description: 'Ticker symbol (must be supported by the price service)',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  @IsIn([...SUPPORTED_BACKTEST_SYMBOLS], {
    message: `symbol must be one of: ${SUPPORTED_BACKTEST_SYMBOLS.join(', ')}`,
  })
  symbol: string;

  @ApiProperty({ example: 100, description: 'Fixed amount per purchase (must be > 0)' })
  @Type(() => Number)
  @IsNumber()
  @IsPositive({ message: 'Amount must be greater than 0' })
  amount: number;

  @ApiProperty({ enum: DCA_FREQUENCIES, example: 'daily' })
  @IsIn(DCA_FREQUENCIES, {
    message: 'Frequency must be one of: daily, weekly, monthly',
  })
  frequency: DcaFrequency;

  @ApiProperty({
    example: 1746057600000,
    description: 'Start date as epoch milliseconds (UTC midnight expected)',
  })
  @Type(() => Number)
  @IsNumber()
  @IsInt()
  startDate: number;

  @ApiProperty({
    example: 1748736000000,
    description: 'End date as epoch milliseconds (UTC midnight expected)',
  })
  @Type(() => Number)
  @IsNumber()
  @IsInt()
  @Validate(IsEndAfterStartConstraint)
  endDate: number;
}
