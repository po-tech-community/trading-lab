import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import type { AuthUser } from '../auth/auth.service';

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
}