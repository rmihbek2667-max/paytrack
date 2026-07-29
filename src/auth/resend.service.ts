import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

// Resend transactional email integration.
// Docs: https://resend.com/docs/api-reference/emails/send-email
//
// Required env vars:
//   RESEND_API_KEY   — from resend.com dashboard
//   RESEND_FROM      — verified sender, e.g. 'PayTrack <noreply@yourdomain.com>'
//                      For testing before you own a domain, Resend provides
//                      a shared test sender: 'onboarding@resend.dev'
//                      (only deliverable to the email you signed up to Resend with)

@Injectable()
export class ResendService {
  private readonly logger = new Logger(ResendService.name);

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM || 'onboarding@resend.dev';

    if (!apiKey) {
      throw new Error('RESEND_API_KEY env var is not set');
    }

    try {
      await axios.post(
        'https://api.resend.com/emails',
        { from, to, subject, html },
        { headers: { Authorization: `Bearer ${apiKey}` } },
      );
    } catch (err: any) {
      this.logger.error('Resend email send failed', err.response?.data ?? err.message);
      throw err;
    }
  }

  async sendVerificationCode(to: string, code: string): Promise<void> {
    await this.sendEmail(
      to,
      'Your PayTrack verification code',
      `<div style="font-family: sans-serif; padding: 24px;">
         <h2 style="color: #7C5CFC;">PayTrack</h2>
         <p>Your verification code is:</p>
         <p style="font-size: 32px; font-weight: 700; letter-spacing: 4px;">${code}</p>
         <p style="color: #888;">This code expires in 5 minutes. If you didn't request this, you can ignore this email.</p>
       </div>`,
    );
  }
}
