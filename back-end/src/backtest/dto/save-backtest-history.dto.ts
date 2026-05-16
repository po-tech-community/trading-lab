import { IsArray, IsIn, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SaveBacktestHistoryDto {
  @ApiProperty({ enum: ['single', 'portfolio'] })
  @IsString()
  @IsIn(['single', 'portfolio'])
  mode: 'single' | 'portfolio';

  @ApiProperty()
  @IsString()
  label: string;

  @ApiProperty()
  @IsObject()
  summary: Record<string, number>;

  @ApiProperty({ required: false, type: [Object] })
  @IsArray()
  @IsOptional()
  trades?: Record<string, unknown>[];

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  config?: Record<string, unknown>;
}
