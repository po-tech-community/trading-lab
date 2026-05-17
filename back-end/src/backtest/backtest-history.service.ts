import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BacktestHistory, BacktestHistoryDocument } from './schemas/backtest-history.schema';
import { SaveBacktestHistoryDto } from './dto/save-backtest-history.dto';

@Injectable()
export class BacktestHistoryService {
  constructor(
    @InjectModel(BacktestHistory.name)
    private readonly historyModel: Model<BacktestHistoryDocument>,
  ) {}

  async save(userId: string, dto: SaveBacktestHistoryDto): Promise<BacktestHistory> {
    const doc = new this.historyModel({ userId, ...dto });
    return doc.save();
  }

  async listByUser(userId: string): Promise<BacktestHistory[]> {
    return this.historyModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()
      .exec();
  }

  async deleteOne(userId: string, id: string): Promise<void> {
    await this.historyModel.deleteOne({ _id: id, userId }).exec();
  }
}
