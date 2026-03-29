import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RunDcaBacktestDto } from './run-dca-backtest.dto';

describe('RunDcaBacktestDto', () => {
  const day = (value: string) => new Date(`${value}T00:00:00.000Z`).getTime();

  it('passes for valid payload', async () => {
    const dto = plainToInstance(RunDcaBacktestDto, {
      symbol: 'BTC',
      amount: 100,
      frequency: 'daily',
      startDate: day('2025-01-01'),
      endDate: day('2025-01-03'),
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects non-positive amount', async () => {
    const dto = plainToInstance(RunDcaBacktestDto, {
      symbol: 'BTC',
      amount: 0,
      frequency: 'daily',
      startDate: day('2025-01-01'),
      endDate: day('2025-01-02'),
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'amount')).toBe(true);
  });

  it('rejects invalid frequency', async () => {
    const dto = plainToInstance(RunDcaBacktestDto, {
      symbol: 'BTC',
      amount: 100,
      frequency: 'hourly',
      startDate: day('2025-01-01'),
      endDate: day('2025-01-02'),
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'frequency')).toBe(true);
  });

  it('rejects unsupported symbol', async () => {
    const dto = plainToInstance(RunDcaBacktestDto, {
      symbol: 'DOGE',
      amount: 100,
      frequency: 'daily',
      startDate: day('2025-01-01'),
      endDate: day('2025-01-02'),
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'symbol')).toBe(true);
  });

  it('rejects endDate before or equal to startDate', async () => {
    const dto = plainToInstance(RunDcaBacktestDto, {
      symbol: 'BTC',
      amount: 100,
      frequency: 'daily',
      startDate: day('2025-01-03'),
      endDate: day('2025-01-01'),
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'endDate')).toBe(true);
  });
});
