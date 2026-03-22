import { Controller, Delete, Get, HttpCode, UseGuards, Body, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import type { AuthUser } from '../auth/auth.service';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)   // ALL routes in this controller require a valid token
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile (protected)' })
    @ApiResponse({ status: 200, description: 'Returns the logged-in user profile' })
    @ApiResponse({ status: 401, description: 'No valid access token provided' })
    async getMe(@CurrentUser() user: AuthUser) {
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            avatarUrl: user.avatarUrl ?? null,
        };
    }

    @Delete('me')
    @HttpCode(204)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Soft delete current user account (protected)' })
    @ApiResponse({ status: 204, description: 'Account deleted' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async deleteMe(@CurrentUser() user: AuthUser) {
        await this.usersService.softDelete(user.id);
    }
 
    @Patch('me')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update current user profile (protected)' })
    @ApiBody({ type: UpdateUserDto })
    @ApiResponse({ status: 200, description: 'User updated' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateUserDto) {
        const updated = await this.usersService.update(user.id, dto);
        return {
            id: updated!.id,
            email: updated!.email,
            firstName: updated!.firstName,
            lastName: updated!.lastName,
            avatarUrl: updated!.avatarUrl ?? null,
        };
    }
}