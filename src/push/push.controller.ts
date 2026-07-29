import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsString, IsIn, IsNumber, IsOptional } from 'class-validator';
import { PushService } from './push.service';

class RegisterTokenDto {
  @IsString()
  token!: string;

  @IsString()
  @IsIn(['ios', 'android', 'web'])
  platform!: string;
}

// Lets you manually fire a money-event notification before any real
// payment processor exists -- proves the whole pipeline works end-to-end.
class SimulateMoneyEventDto {
  @IsIn(['money_received', 'money_sent', 'bill_paid'])
  kind!: 'money_received' | 'money_sent' | 'bill_paid';

  @IsNumber()
  amount!: number;

  @IsOptional()
  @IsString()
  counterparty?: string;
}

@Controller('push')
@UseGuards(AuthGuard('jwt'))
export class PushController {
  constructor(private pushService: PushService) {}

  @Post('register')
  register(@Req() req: any, @Body() dto: RegisterTokenDto) {
    return this.pushService.registerToken(req.user.sub, dto.token, dto.platform);
  }

  @Post('unregister')
  unregister(@Req() req: any, @Body() dto: { token: string }) {
    return this.pushService.unregisterToken(req.user.sub, dto.token);
  }

  // TEMPORARY: simulates a payment processor webhook firing. Once a real
  // processor (Payme/Click/etc) is integrated, their webhook calls
  // pushService.notifyMoneyEvent() directly -- this endpoint becomes
  // unnecessary and can be removed or left as an internal testing tool.
  @Post('simulate-money-event')
  simulate(@Req() req: any, @Body() dto: SimulateMoneyEventDto) {
    return this.pushService.notifyMoneyEvent({
      userId: req.user.sub,
      kind: dto.kind,
      amount: dto.amount,
      counterparty: dto.counterparty,
    });
  }
}
