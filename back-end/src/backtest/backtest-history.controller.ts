import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { BacktestHistoryService } from './backtest-history.service';
import { SaveBacktestHistoryDto } from './dto/save-backtest-history.dto';

@ApiTags('backtest-history')
@UseGuards(JwtAuthGuard)
@Controller('backtest/history')
export class BacktestHistoryController {
  constructor(private readonly historyService: BacktestHistoryService) {}

  @Post()
  @ApiOperation({ summary: 'Save a backtest result to history' })
  @ApiBody({ type: SaveBacktestHistoryDto })
  save(@CurrentUser() user: JwtPayload, @Body() dto: SaveBacktestHistoryDto) {
    return this.historyService.save(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List backtest history for the current user (most recent 20)' })
  list(@CurrentUser() user: JwtPayload) {
    return this.historyService.listByUser(user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a backtest history entry' })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.historyService.deleteOne(user.sub, id);
  }
}
