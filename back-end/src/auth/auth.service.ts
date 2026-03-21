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
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
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

    const payload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = this.signAccessToken(payload);
    const refreshToken = this.signRefreshToken(payload);

    return {
      user: this.toAuthUser(user),
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

    const isValidPassword = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = this.signAccessToken(payload);
    const refreshToken = this.signRefreshToken(payload);

    return {
      user: this.toAuthUser(user),
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

    const newPayload = { sub: user.id, email: user.email };
    const accessToken = this.signAccessToken(newPayload);
    const newRefreshToken = this.signRefreshToken(newPayload);

    return { user: this.toAuthUser(user), accessToken, refreshToken: newRefreshToken };
  }
}
