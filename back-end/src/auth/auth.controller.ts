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

import { Body, Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request,Response } from 'express';
import { AuthService, GoogleProfile } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';
import { GoogleAuthGuard } from './google/google.guard';


@ApiTags('auth')
@Controller('auth')
@Public()
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  private setRefreshTokenCookie(res: Response, refreshToken: string): void {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    });
  }

  private getIp(req: Request): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.ip ?? 'unknown';
  }

  @Post('register')
  @ApiOperation({ summary: 'Register (public)' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User created and access token returned' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  register(@Body() dto: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.register(dto, this.getIp(req)).then(({ user, accessToken, refreshToken }) => {
      this.setRefreshTokenCookie(res, refreshToken);
      return { user, accessToken };
    });
  }

  @Post('login')
  @ApiOperation({ summary: 'Login (public)' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Access token returned' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(dto, this.getIp(req)).then(({ user, accessToken, refreshToken }) => {
      this.setRefreshTokenCookie(res, refreshToken);
      return { user, accessToken };
    });
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token (public)' })
  @ApiResponse({ status: 200, description: 'New access token returned' })
  @ApiResponse({ status: 401, description: 'Refresh token missing or invalid' })
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.refreshToken;
    if (!token) throw new UnauthorizedException('Refresh token missing');

    return this.authService.refresh(token, this.getIp(req)).then(({ user, accessToken, refreshToken }) => {
      this.setRefreshTokenCookie(res, refreshToken);
      return { user, accessToken };
    });
  }

  @Post('logout')
  @ApiOperation({summary: 'Logout (public)'})
  @ApiResponse({status: 200, description: 'Logged out successfully'})
  logout(@Req() req: Request, @Res({passthrough: true}) res: Response) {
    const token = req.cookies?.refreshToken;
    res.clearCookie('refreshToken', {path: '/'})
    return this.authService.logout('', this.getIp(req)).then(() => ({message:'Logged out'}))
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallBack(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const result = await this.authService.googleLogin(req.user as GoogleProfile);
    res.cookie('refreshToken', result.refreshToken, {httpOnly: true})
    return res.redirect(
      `http://localhost:3000/oauth-success?token=${result.accessToken}`
    );
  }
}
