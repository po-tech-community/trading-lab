/**
 * DTO for updating a Todo – used as PATCH /todos/:id body.
 *
 * What it does: All fields optional (title, description, completed) so clients send only changed fields.
 * Same validation rules as CreateTodoDto for each field when present.
 *
 * Use cases: Use in controller as @Body() dto: UpdateTodoDto.
 *
 * @see https://docs.nestjs.com/techniques/validation
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateTodoDto {
  @ApiPropertyOptional({ example: 'Updated title', minLength: 1, maxLength: 200 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
