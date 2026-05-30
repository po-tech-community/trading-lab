import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import type { AuthUser } from '../auth/auth.service';
import { UpdateMeDto } from './dto/update-me.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuditService } from '../audit/audit.service';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly auditService: AuditService,
    ) { }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile (protected)' })
  @ApiResponse({
    status: 200,
    description: 'Returns the logged-in user profile',
  })
  @ApiResponse({ status: 401, description: 'No valid access token provided' })
  async getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.findProfileByEmail(user.email);
  }

    @Delete('me')
    @HttpCode(204)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Soft delete current user account (protected)' })
    @ApiResponse({ status: 204, description: 'Account deleted' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async deleteMe(@CurrentUser() user: AuthUser) {
        await this.usersService.softDelete(user.id);
        await this.auditService.logAuthEvent('soft_delete', user.id, {
            email: user.email,
        });
    }
 
    @Patch('me')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update current user profile (protected)' })
    @ApiBody({ type: UpdateUserDto })
    @ApiResponse({ status: 200, description: 'User updated' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateUserDto) {
        const updated = await this.usersService.update(user.id, dto);
        await this.auditService.logAuthEvent('profile_update', user.id, {
            updatedFields: Object.keys(dto),
        });
        return {
            id: updated!.id,
            email: updated!.email,
            firstName: updated!.firstName,
            lastName: updated!.lastName,
            avatarUrl: updated!.avatarUrl ?? null,
        };
    }
}
