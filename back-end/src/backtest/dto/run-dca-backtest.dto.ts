import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsPositive } from 'class-validator';
import { DCA_FREQUENCIES, type DcaFrequency } from './dca-frequency';

/** Plain input shape for the calculation engine (validated via {@link RunDcaBacktestDto} at the HTTP boundary). */
export interface RunDcaBacktestParams {
  amount: number;
  frequency: DcaFrequency;
  startDate: number;
  endDate: number;
}

export class RunDcaBacktestDto implements RunDcaBacktestParams {
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
  endDate: number;
}
