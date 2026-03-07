/**
 * DTO for creating a Todo – used as POST /todos body.
 *
 * What it does: Validates title (required, 1–200 chars), optional description (max 1000), optional completed (boolean).
 * ValidationPipe uses class-validator decorators; Swagger uses @ApiProperty for docs.
 *
 * Use cases: Use in controller as @Body() dto: CreateTodoDto. Add/change decorators for new rules.
 *
 * @see https://docs.nestjs.com/techniques/validation
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTodoDto {
  @ApiProperty({ example: 'Learn NestJS', minLength: 1, maxLength: 200 })
  @IsString()
  @MinLength(1, { message: 'Title must not be empty' })
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Read docs and build a sample module' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
