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
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

/** In-memory stub: replace with User model from DB (UsersModule) when implementing L0. */
export interface StubUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
}

export type AuthUser = Omit<StubUser, 'passwordHash'>;

@Injectable()
export class AuthService {
  private readonly users = new Map<string, StubUser>();
  private idCounter = 1;

  constructor(private readonly jwtService: JwtService) {}

  async register(dto: RegisterDto): Promise<{ user: AuthUser; accessToken: string }> {
    const existing = Array.from(this.users.values()).find((u) => u.email === dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const id = String(this.idCounter++);
    const user: StubUser = {
      id,
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      passwordHash,
    };
    this.users.set(id, user);

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);
    const { passwordHash: _, ...safe } = user;
    return { user: safe, accessToken };
  }

  async validateUser(email: string, password: string): Promise<AuthUser | null> {
    const user = Array.from(this.users.values()).find((u) => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return null;
    const { passwordHash: _, ...safe } = user;
    return safe;
  }

  async login(dto: LoginDto): Promise<{ user: AuthUser; accessToken: string }> {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);
    return { user, accessToken };
  }
}
