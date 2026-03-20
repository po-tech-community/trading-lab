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

<<<<<<< HEAD
import { Body, Controller, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
=======
import { Body, Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request,Response } from 'express';
import { AuthService, GoogleProfile } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';
import { GoogleAuthGuard } from './google/google.guard';

>>>>>>> fd1ab85 (feat(audit logging + oauth): log auth events and implement OAuth with google)

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private getIp(req: Request): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.ip ?? 'unknown';
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User created and access token returned' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
<<<<<<< HEAD

  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto);
    this.setRefreshTokenCookie(res, result.refreshToken);

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
=======
  register(@Body() dto: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.register(dto, this.getIp(req)).then(({ user, accessToken, refreshToken }) => {
      this.setRefreshTokenCookie(res, refreshToken);
      return { user, accessToken };
    });
>>>>>>> fd1ab85 (feat(audit logging + oauth): log auth events and implement OAuth with google)
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Access token returned' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
<<<<<<< HEAD
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);
    this.setRefreshTokenCookie(res, result.refreshToken);

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
=======
  login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(dto, this.getIp(req)).then(({ user, accessToken, refreshToken }) => {
      this.setRefreshTokenCookie(res, refreshToken);
      return { user, accessToken };
    });
>>>>>>> fd1ab85 (feat(audit logging + oauth): log auth events and implement OAuth with google)
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token (public)' })
  @ApiResponse({ status: 200, description: 'New access token returned' })
  @ApiResponse({ status: 401, description: 'Refresh token missing or invalid' })
<<<<<<< HEAD
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = (req as any).cookies?.refreshToken;
    if (!token) throw new UnauthorizedException('Refresh token missing');

    const { user, accessToken, refreshToken } = await this.authService.refresh(token);
    this.setRefreshTokenCookie(res, refreshToken);
    return { user, accessToken };
  }

  private setRefreshTokenCookie(res: Response, token: string): void {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: Number(this.configService.get('REFRESH_TOKEN_MAX_AGE')),
=======
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.refreshToken;
    if (!token) throw new UnauthorizedException('Refresh token missing');

    return this.authService.refresh(token, this.getIp(req)).then(({ user, accessToken, refreshToken }) => {
      this.setRefreshTokenCookie(res, refreshToken);
      return { user, accessToken };
>>>>>>> fd1ab85 (feat(audit logging + oauth): log auth events and implement OAuth with google)
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
