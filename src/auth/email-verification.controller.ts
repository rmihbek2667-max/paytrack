import { Body, Controller, Post } from '@nestjs/common';
import { IsEmail, IsString, Length } from 'class-validator';
import { EmailVerificationService } from './email-verification.service';

class SendCodeDto {
  @IsEmail()
  email!: string;
}

class VerifyCodeDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 6, { message: 'code must be exactly 6 digits' })
  code!: string;
}

@Controller('auth')
export class EmailVerificationController {
  constructor(private readonly emailVerification: EmailVerificationService) {}

  @Post('send-email-code')
  async sendCode(@Body() dto: SendCodeDto) {
    await this.emailVerification.sendCode(dto.email);
    return { message: 'Verification code sent' };
  }

  @Post('verify-email-code')
  async verifyCode(@Body() dto: VerifyCodeDto) {
    const valid = this.emailVerification.verifyCode(dto.email, dto.code);
    return { valid };
  }
}
