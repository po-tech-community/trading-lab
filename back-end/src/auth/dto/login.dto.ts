/**
 * DTO for POST /auth/login – login body.
 *
 * Validation: email format, password required.
 *
 * @see https://docs.nestjs.com/techniques/validation
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123' })
  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password: string;
}
