/**
 * Query DTO for GET /todos list – used as @Query() params.
 *
 * What it does: page (default 1), limit (default 10, max 100), completed ('true'|'false' to filter).
 * @Type(() => Number) with transform: true in ValidationPipe coerces query strings to numbers.
 *
 * Use cases: Use in controller as @Query() query: ListTodoQueryDto.
 *
 * @see https://docs.nestjs.com/techniques/validation
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class ListTodoQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: ['true', 'false'], description: 'Filter by completed' })
  @IsOptional()
  completed?: 'true' | 'false';
}
