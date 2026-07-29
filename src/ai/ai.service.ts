import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { ConfigService } from '@nestjs/config';
import { TransactionsService } from '../transactions/transactions.service';

@Injectable()
export class AiService {
  private client: Anthropic;

  constructor(
    private configService: ConfigService,
    private txService: TransactionsService,
  ) {
    this.client = new Anthropic({
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  async chat(userId: string, messages: { role: string; content: string }[]) {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const to = now.toISOString().slice(0, 10);
    const summary = await this.txService.getSummary(userId, from, to);

    const spendingContext = `
User's real spending data for ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}:
- Total income: $${summary.income}
- Total expenses: $${summary.expenses}
- Net saved: $${summary.saved}
- Number of transactions: ${summary.transactionCount}
- Spending by category: ${JSON.stringify(summary.byCategory)}
- Top 5 expenses: ${summary.topExpenses.map(e => `${e.label} ($${e.amount})`).join(', ')}
`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: `You are PayTrack's AI financial assistant. Be concise, friendly, and specific.
Give personalized advice based on this user's ACTUAL spending data:
${spendingContext}
Keep responses under 150 words. Use $ for amounts. No markdown formatting.
If the user has no transactions yet, encourage them to add some to get personalized insights.`,
      messages: messages as any,
    });

    return { reply: (response.content[0] as any).text };
  }
}
