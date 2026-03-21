import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import type { AuthUser } from '../auth/auth.service';
import { UpdateMeDto } from './dto/update-me.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile (protected)' })
  @ApiResponse({ status: 200, description: 'Returns the logged-in user profile' })
  @ApiResponse({ status: 401, description: 'No valid access token provided' })
  async getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.findProfileByEmail(user.email);
  }

  @Patch('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile (protected)' })
  @ApiResponse({ status: 200, description: 'Returns the updated user profile' })
  @ApiResponse({ status: 401, description: 'No valid access token provided' })
  async updateMe(
    @CurrentUser() user: AuthUser,
    @Body() updateMeDto: UpdateMeDto,
  ) {
    return this.usersService.updateMeByEmail(user.email, updateMeDto);
    }
}