import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushToken } from './push-token.entity';

// Expo's push API endpoint -- works for both iOS and Android via one unified API
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export interface MoneyEventNotification {
  userId: string;
  kind: 'money_received' | 'money_sent' | 'bill_paid';
  amount: number;
  counterparty?: string; // sender/recipient name or bill type
  newBalance?: number;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    @InjectRepository(PushToken)
    private repo: Repository<PushToken>,
  ) {}

  async registerToken(userId: string, token: string, platform: string): Promise<void> {
    const existing = await this.repo.findOne({ where: { userId, token } });
    if (existing) return; // already registered
    await this.repo.save(this.repo.create({ userId, token, platform }));
  }

  async unregisterToken(userId: string, token: string): Promise<void> {
    await this.repo.delete({ userId, token });
  }

  // THIS is the function any future payment processor webhook calls.
  // Webhook receives "money moved" event from Payme/Click/bank ->
  // calls this -> user gets a push notification, even with the app closed.
  async notifyMoneyEvent(event: MoneyEventNotification): Promise<void> {
    const tokens = await this.repo.find({ where: { userId: event.userId } });
    if (tokens.length === 0) {
      this.logger.warn(`No push tokens registered for user ${event.userId}`);
      return;
    }

    const { title, body } = this.buildMessage(event);

    const messages = tokens.map(t => ({
      to: t.token,
      sound: 'default',
      title,
      body,
      data: { type: event.kind, amount: event.amount },
    }));

    try {
      await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(messages),
      });
    } catch (err) {
      this.logger.error('Failed to send push notification', err);
    }
  }

  private buildMessage(event: MoneyEventNotification): { title: string; body: string } {
    const amt = event.amount.toFixed(2);
    switch (event.kind) {
      case 'money_received':
        return {
          title: '💰 Money received',
          body: `+$${amt} from ${event.counterparty ?? 'someone'}` +
                (event.newBalance ? `. Balance: $${event.newBalance.toFixed(2)}` : ''),
        };
      case 'money_sent':
        return {
          title: '📤 Money sent',
          body: `-$${amt} to ${event.counterparty ?? 'recipient'}` +
                (event.newBalance ? `. Balance: $${event.newBalance.toFixed(2)}` : ''),
        };
      case 'bill_paid':
        return {
          title: '🧾 Bill paid',
          body: `-$${amt} for ${event.counterparty ?? 'your bill'}` +
                (event.newBalance ? `. Balance: $${event.newBalance.toFixed(2)}` : ''),
        };
    }
  }
}
