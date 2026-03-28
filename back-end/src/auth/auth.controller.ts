/**
 * Auth CONTROLLER – POST /auth/register, POST /auth/login (both public).
 *
 * Pipeline: Request → LoggingInterceptor (log) → No guard (auth routes are public) →
 * ValidationPipe (validate DTO) → AuthController → AuthService.
 *
 * Students: Add GET /auth/me (protected) later when you have User in DB; use @UseGuards(JwtAuthGuard).
 *
 * @see https://docs.nestjs.com/security/authentication
 * @see doc/developer-tasks.md L0-BE-4, L0-BE-5
 */

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User created and access token returned',
  })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);
    this.setRefreshTokenCookie(res, result.refreshToken);

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Access token returned' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    this.setRefreshTokenCookie(res, result.refreshToken);

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token (public)' })
  @ApiResponse({ status: 200, description: 'New access token returned' })
  @ApiResponse({ status: 401, description: 'Refresh token missing or invalid' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = (req as any).cookies?.refreshToken;
    if (!token) throw new UnauthorizedException('Refresh token missing');

    const { user, accessToken, refreshToken } =
      await this.authService.refresh(token);
    this.setRefreshTokenCookie(res, refreshToken);
    return { user, accessToken };
  }

  @Get('google')
  @ApiOperation({ summary: 'Redirect to Google OAuth consent screen' })
  @ApiResponse({ status: 302, description: 'Redirects user to Google OAuth' })
  googleAuth(
    @Query('redirect') redirect: string | undefined,
    @Res() res: Response,
  ) {
    return res.redirect(
      this.authService.getGoogleAuthUrl(redirect === 'frontend'),
    );
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Handle Google OAuth callback' })
  @ApiResponse({
    status: 200,
    description: 'Returns user and access token after Google login',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid Google authorization code',
  })
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.loginWithGoogle(code);
    this.setRefreshTokenCookie(res, result.refreshToken);

    if (state) {
      if (!this.authService.isValidGoogleFrontendState(state)) {
        throw new BadRequestException('Invalid Google redirect state');
      }

      return res.redirect(
        this.authService.buildGoogleFrontendRedirectUrl({
          redirectUrl: state,
        }),
      );
    }

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout current user' })
  @ApiResponse({
    status: 200,
    description: 'User logged out and refresh cookie cleared',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(user.id);
    this.clearRefreshTokenCookie(res);

    return { message: 'Logged out successfully' };
  }

  private setRefreshTokenCookie(res: Response, token: string): void {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: Number(this.configService.get('REFRESH_TOKEN_MAX_AGE')),
    });
  }

  private clearRefreshTokenCookie(res: Response): void {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
    });
  }
}
