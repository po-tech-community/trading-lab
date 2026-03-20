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
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/schemas/user.schema';
import { AuditService } from 'src/audit/audit.service';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  googleId?: string;
}

export interface GoogleProfile {
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  googleId: string;
}

export async function comparePassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) { }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = Number(
      this.configService.get<number>('BCRYPT_SALT_ROUNDS') ?? 10,
    );
    return bcrypt.hash(password, saltRounds);
  }

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
      avatarUrl: user.avatarUrl ?? undefined,
    };
  }

  async register(
    dto: RegisterDto,
    ip?: string,
  ): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      await this.auditService.log({event: 'REGISTER', email: dto.email, ip, metadata: {reason: 'email_already_registered'}});
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      passwordHash,
    });

    const payload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = this.signAccessToken(payload);
    const refreshToken = this.signRefreshToken(payload);
    const authUser = this.toAuthUser(user)
    await this.auditService.log({event: 'REGISTER', userId: authUser.id, email: authUser.email, ip})

    return { user: authUser, accessToken, refreshToken };
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthUser | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;
    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) return null;
    return this.toAuthUser(user);
  }

  async login(
    dto: LoginDto,
    ip?: string,
  ): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      await this.auditService.log({event: 'LOGIN', email: dto.email, ip, metadata: {reason: 'invalid_credentials'}});
      throw new UnauthorizedException('Invalid email or password');
    }
    
    const payload = {sub: user.id, email: user.email}
    const accessToken = this.signAccessToken(payload);
    const refreshToken = this.signRefreshToken(payload);

    await this.auditService.log({event: 'LOGIN', userId: user.id, email: user.email, ip})

    return { user, accessToken, refreshToken };
  }

  async refresh(
    refreshToken: string,
    ip?: string,
  ): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
    let payload: { sub: string; email: string };

    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      await this.auditService.log({event: 'REFRESH', ip, metadata: {reason: 'invalid_or_expired_token'}})
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      await this.auditService.log({event:'REFRESH', userId: payload.sub, ip, metadata: {reason: 'user_not_found'}})
      throw new UnauthorizedException('User not found');
    }

    const newPayload = { sub: user.id, email: user.email };
    const accessToken = this.signAccessToken(newPayload);
    const newRefreshToken = this.signRefreshToken(newPayload);

    await this.auditService.log({event: 'REFRESH', userId: user.id, email: user.email, ip})

    return { user: this.toAuthUser(user), accessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string, ip?: string): Promise<void> {
    await this.auditService.log({event: 'LOGOUT', userId, ip})
  }

  async googleLogin(
    profile: GoogleProfile,
    ip?: string,
  ): Promise<{user: AuthUser; accessToken: string; refreshToken: string}> {
    let user = await this.usersService.findByEmail(profile.email);

    if (!user) {
      user = await this.usersService.create({
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatarUrl: profile.avatarUrl,
        googleId: profile.googleId,
        passwordHash: '',
      });
      await this.auditService.log({event: 'REGISTER', userId: user.id, email: user.email, ip, metadata: {provider: 'google'}})
    } else {
      if (!user.googleId) {
        await this.usersService.update(user.id, {googleId: profile.googleId})
      }
      await this.auditService.log({event: 'LOGIN', userId: user.id, email: user.email, ip, metadata: {provider: 'google'}})
    }

    const authUser = this.toAuthUser(user);
    const payload = {sub: authUser.id, email: authUser.email};
    const accessToken = this.signAccessToken(payload);
    const refreshToken = this.signRefreshToken(payload);

    return {user: authUser, accessToken, refreshToken}
  }
}
