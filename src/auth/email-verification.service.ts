import { Injectable, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { ResendService } from './resend.service';

// In-memory store for MVP purposes — resets on server restart, won't work
// across multiple backend instances. Fine for solo-dev MVP; move to Redis
// or a DB table (with an expiry column) once you have real infra.

interface CodeRecord {
  hash: string;
  expiresAt: number;
  attempts: number;
}

const CODE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute between sends

@Injectable()
export class EmailVerificationService {
  private store = new Map<string, CodeRecord>();
  private lastSentAt = new Map<string, number>();

  constructor(private readonly resend: ResendService) {}

  private hash(code: string, email: string): string {
    return crypto.createHash('sha256').update(`${email.toLowerCase()}:${code}`).digest('hex');
  }

  async sendCode(email: string): Promise<void> {
    const normalized = email.toLowerCase().trim();

    const lastSent = this.lastSentAt.get(normalized);
    if (lastSent && Date.now() - lastSent < RESEND_COOLDOWN_MS) {
      throw new BadRequestException('Please wait before requesting another code');
    }

    const code = crypto.randomInt(100000, 999999).toString();
    this.store.set(normalized, {
      hash: this.hash(code, normalized),
      expiresAt: Date.now() + CODE_TTL_MS,
      attempts: 0,
    });
    this.lastSentAt.set(normalized, Date.now());

    await this.resend.sendVerificationCode(normalized, code);
  }

  verifyCode(email: string, code: string): boolean {
    const normalized = email.toLowerCase().trim();
    const record = this.store.get(normalized);
    if (!record) throw new BadRequestException('No verification code was requested for this email');

    if (Date.now() > record.expiresAt) {
      this.store.delete(normalized);
      throw new BadRequestException('Verification code expired, please request a new one');
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      this.store.delete(normalized);
      throw new BadRequestException('Too many incorrect attempts, please request a new code');
    }

    record.attempts += 1;

    const valid = record.hash === this.hash(code, normalized);
    if (valid) this.store.delete(normalized); // one-time use
    return valid;
  }
}
