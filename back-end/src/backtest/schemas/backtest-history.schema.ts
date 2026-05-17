import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BacktestHistoryDocument = HydratedDocument<BacktestHistory>;

@Schema({ timestamps: true, collection: 'backtest_history' })
export class BacktestHistory {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, enum: ['single', 'portfolio'] })
  mode: 'single' | 'portfolio';

  @Prop({ required: true })
  label: string;

  @Prop({ type: Object, required: true })
  summary: Record<string, number>;

  @Prop({ type: [Object], default: [] })
  trades: Record<string, unknown>[];

  @Prop({ type: Object, default: null })
  config: Record<string, unknown> | null;

  createdAt: Date;
  updatedAt: Date;
}

export const BacktestHistorySchema = SchemaFactory.createForClass(BacktestHistory);
