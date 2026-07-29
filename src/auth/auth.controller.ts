import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // Exchanges a still-valid refresh token for a new access+refresh pair.
  // Called by the mobile app's axios interceptor whenever an API call comes
  // back 401 -- covers the case where the app was unlocked via PIN/biometrics
  // after the 15-minute access token had already expired.
  @Post('refresh')
  refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  // Protected profile endpoint -- returns the current user's email/fullName.
  // Also used by the mobile app after FaceID unlock to confirm the cached
  // token is still valid.
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async me(@Req() req: any) {
    const user = await this.usersService.findById(req.user.sub);
    return { email: user?.email, fullName: user?.fullName ?? null };
  }
}
