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

import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/schemas/user.schema';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
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
  ) { }

  private toAuthUser(user: UserDocument): AuthUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
    };
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = Number(
      this.configService.get<number>('BCRYPT_SALT_ROUNDS') ?? 10,
    );
    return bcrypt.hash(password, saltRounds);
  }

  private signAccessToken(payload: { sub: string; email: string }): string {
    return this.jwtService.sign(payload);
  }

  private signRefreshToken(payload: { sub: string; email: string }): string {
    const refreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
    return this.jwtService.sign(payload, { expiresIn: refreshExpiresIn });
  }

  async register(
    dto: RegisterDto,
  ): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await this.hashPassword(dto.password);
    const created = await this.usersService.create({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      passwordHash,
    });

    const authUser = this.toAuthUser(created);
    const payload = { sub: authUser.id, email: authUser.email };
    const accessToken = this.signAccessToken(payload);
    const refreshToken = this.signRefreshToken(payload);

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
  ): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.signAccessToken(payload);
    const refreshToken = this.signRefreshToken(payload);

    return { user, accessToken, refreshToken };
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
