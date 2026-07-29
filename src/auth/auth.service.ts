import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '60d'; // was 30d -- bumped since PIN/biometric already gates re-entry

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
    });

    // Email verification (via Resend) happens as a separate step before this
    // in the signup flow -- see email-verification.service.ts. By the time
    // signup() is called, the code has already been confirmed on the frontend.

    return this.issueTokens(user.id, user.email);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueTokens(user.id, user.email);
  }

  // Called by POST /auth/refresh. Verifies the refresh token (throws if
  // expired/tampered) and issues a brand new access+refresh pair. We re-look-up
  // the user rather than trusting the payload, in case they were deleted/banned
  // since the refresh token was issued.
  async refresh(refreshToken: string) {
    let payload: { sub: string; email: string };
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch {
      throw new UnauthorizedException('Session expired, please log in again');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Session expired, please log in again');
    }

    return this.issueTokens(user.id, user.email);
  }

  private issueTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: ACCESS_TOKEN_TTL }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: REFRESH_TOKEN_TTL }),
    };
  }
}
