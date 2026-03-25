/**
 * Auth SERVICE (stub) – register, validate user, login (issue JWT).
 *
 * Pipeline: Controller receives body → ValidationPipe validates DTO → Controller calls
 * AuthService.register() or login() → Service hashes password (bcrypt), issues JWT (JwtService).
 *
 * Current stub: in-memory user store. Replace with User model from UsersModule (MongoDB) for L0.
 *
 * @see https://docs.nestjs.com/security/authentication
 * @see doc/developer-tasks.md L0-BE-2 (password hashing), L0-BE-4/5 (register/login)
 */

import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token?: string;
}

interface GoogleProfile {
  sub: string;
  email: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
  picture?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

  private signAccessToken(payload: { sub: string; email: string }): string {
    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    });
  }

  private signRefreshToken(payload: { sub: string; email: string }): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: '7d',
    });
  }

  private issueAuthTokens(user: { id?: string; _id?: unknown; email: string }) {
    const payload = {
      sub: user.id ?? String(user._id),
      email: user.email,
    };

    return {
      accessToken: this.signAccessToken(payload),
      refreshToken: this.signRefreshToken(payload),
    };
  }

  private toAuthUser(user: {
    id?: string;
    _id?: unknown;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  }): AuthUser {
    return {
      id: user.id ?? String(user._id),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl ?? null,
    };
  }

  private getGoogleCallbackUrl(): string {
    return this.configService.getOrThrow<string>('GOOGLE_CALLBACK_URL');
  }

  private getFrontendGoogleCallbackUrl(): string {
    const configuredUrl = this.configService.get<string>('FRONTEND_GOOGLE_CALLBACK_URL');
    if (configuredUrl) {
      return configuredUrl;
    }

    const frontendOrigin = this.configService.getOrThrow<string>('FRONTEND_ORIGIN');
    return `${frontendOrigin.replace(/\/$/, '')}/auth/google/callback`;
  }

  getGoogleAuthUrl(redirectToFrontend = false): string {
    const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const paramsObject: Record<string, string> = {
      client_id: this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      redirect_uri: this.getGoogleCallbackUrl(),
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    };

    if (redirectToFrontend) {
      paramsObject.state = this.getFrontendGoogleCallbackUrl();
    }

    const params = new URLSearchParams(paramsObject);

    return `${baseUrl}?${params.toString()}`;
  }

  private async exchangeGoogleCodeForTokens(code: string): Promise<GoogleTokenResponse> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
        client_secret: this.configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
        redirect_uri: this.getGoogleCallbackUrl(),
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!response.ok) {
      throw new UnauthorizedException('Failed to exchange Google authorization code');
    }

    return response.json() as Promise<GoogleTokenResponse>;
  }

  private async fetchGoogleProfile(accessToken: string): Promise<GoogleProfile> {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new UnauthorizedException('Failed to fetch Google profile');
    }

    return response.json() as Promise<GoogleProfile>;
  }

  private getNamesFromGoogleProfile(profile: GoogleProfile): {
    firstName: string;
    lastName: string;
  } {
    const fullName = profile.name?.trim() ?? '';
    const nameParts = fullName ? fullName.split(/\s+/) : [];
    const firstName = profile.given_name?.trim() || nameParts[0] || 'Google';
    const lastName =
      profile.family_name?.trim() || nameParts.slice(1).join(' ') || 'User';

    return { firstName, lastName };
  }

  async register(
    dto: RegisterDto,
  ): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      passwordHash,
    });

    const { accessToken, refreshToken } = this.issueAuthTokens(user);
    const authUser = this.toAuthUser(user);

    await this.auditService.logAuthEvent('register', authUser.id, {
      email: authUser.email,
    });

    return {
      user: authUser,
      accessToken,
      refreshToken,
    };
  }

  async login(
    dto: LoginDto,
  ): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { accessToken, refreshToken } = this.issueAuthTokens(user);
    const authUser = this.toAuthUser(user);

    await this.auditService.logAuthEvent('login', authUser.id, {
      email: authUser.email,
    });

    return {
      user: authUser,
      accessToken,
      refreshToken,
    };
  }

  async refresh(
    refreshToken: string,
  ): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
    let payload: { sub: string; email: string };

    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) throw new UnauthorizedException('User not found');

    const { accessToken, refreshToken: newRefreshToken } = this.issueAuthTokens(user);
    const authUser = this.toAuthUser(user);

    await this.auditService.logAuthEvent('refresh', authUser.id, {
      email: authUser.email,
    });

    return { user: authUser, accessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string): Promise<void> {
    await this.auditService.logAuthEvent('logout', userId);
  }

  async loginWithGoogle(
    code: string,
  ): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
    if (!code) {
      throw new BadRequestException('Google authorization code is required');
    }

    const tokens = await this.exchangeGoogleCodeForTokens(code);
    const googleProfile = await this.fetchGoogleProfile(tokens.access_token);

    if (!googleProfile.email) {
      throw new UnauthorizedException('Google account email is required');
    }

    if (googleProfile.email_verified === false) {
      throw new UnauthorizedException('Google account email is not verified');
    }

    let user = await this.usersService.findByGoogleId(googleProfile.sub);
    let created = false;

    if (!user) {
      const existingUser = await this.usersService.findByEmail(googleProfile.email);

      if (existingUser) {
        user = await this.usersService.linkGoogleAccount(
          existingUser.id,
          googleProfile.sub,
          googleProfile.picture ?? existingUser.avatarUrl ?? null,
        );
      } else {
        const { firstName, lastName } = this.getNamesFromGoogleProfile(googleProfile);
        const passwordHash = await bcrypt.hash(randomUUID(), 10);

        user = await this.usersService.create({
          firstName,
          lastName,
          email: googleProfile.email,
          passwordHash,
          googleId: googleProfile.sub,
          avatarUrl: googleProfile.picture ?? null,
        });
        created = true;
      }
    }

    if (!user) {
      throw new InternalServerErrorException('Unable to complete Google sign-in');
    }

    const authUser = this.toAuthUser(user);
    const { accessToken, refreshToken } = this.issueAuthTokens(user);

    if (created) {
      await this.auditService.logAuthEvent('register', authUser.id, {
        email: authUser.email,
        provider: 'google',
      });
    }

    await this.auditService.logAuthEvent('login', authUser.id, {
      email: authUser.email,
      provider: 'google',
    });

    return {
      user: authUser,
      accessToken,
      refreshToken,
    };
  }

  buildGoogleFrontendRedirectUrl(data: {
    accessToken: string;
    user: AuthUser;
    redirectUrl?: string;
  }): string {
    const baseUrl = data.redirectUrl || this.getFrontendGoogleCallbackUrl();
    const params = new URLSearchParams({
      accessToken: data.accessToken,
      user: encodeURIComponent(JSON.stringify(data.user)),
    });

    return `${baseUrl}?${params.toString()}`;
  }
}
