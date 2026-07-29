import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private repo: Repository<Transaction>,
  ) {}

  async create(userId: string, dto: CreateTransactionDto): Promise<Transaction> {
    const tx = this.repo.create({ userId, ...dto });
    return this.repo.save(tx);
  }

  async findAll(userId: string, params: {
    limit?: number;
    offset?: number;
    type?: 'income' | 'expense';
    category?: string;
    from?: string;
    to?: string;
  } = {}): Promise<{ data: Transaction[]; total: number }> {
    const qb = this.repo.createQueryBuilder('tx')
      .where('tx.userId = :userId', { userId })
      .orderBy('tx.date', 'DESC')
      .addOrderBy('tx.createdAt', 'DESC');

    if (params.type)     qb.andWhere('tx.type = :type',         { type: params.type });
    if (params.category) qb.andWhere('tx.category = :category', { category: params.category });
    if (params.from)     qb.andWhere('tx.date >= :from',        { from: params.from });
    if (params.to)       qb.andWhere('tx.date <= :to',          { to: params.to });

    const total = await qb.getCount();
    const data = await qb
      .limit(params.limit ?? 50)
      .offset(params.offset ?? 0)
      .getMany();

    return { data, total };
  }

  async findOne(userId: string, id: string): Promise<Transaction> {
    const tx = await this.repo.findOne({ where: { id, userId } });
    if (!tx) throw new NotFoundException('Transaction not found');
    return tx;
  }

  async delete(userId: string, id: string): Promise<void> {
    const tx = await this.findOne(userId, id);
    await this.repo.remove(tx);
  }

  // Returns aggregated summary used by both analytics and the AI assistant
  async getSummary(userId: string, from: string, to: string) {
    const txs = await this.repo
      .createQueryBuilder('tx')
      .where('tx.userId = :userId', { userId })
      .andWhere('tx.date >= :from', { from })
      .andWhere('tx.date <= :to', { to })
      .getMany();

    const income = txs
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = txs
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Group spending by category
    const byCategory: Record<string, number> = {};
    txs.filter(t => t.type === 'expense').forEach(t => {
      byCategory[t.category] = (byCategory[t.category] ?? 0) + Number(t.amount);
    });

    // Group spending by month (last 6 months)
    const byMonth: Record<string, number> = {};
    txs.filter(t => t.type === 'expense').forEach(t => {
      const month = t.date.slice(0, 7); // YYYY-MM
      byMonth[month] = (byMonth[month] ?? 0) + Number(t.amount);
    });

    return {
      income: Number(income.toFixed(2)),
      expenses: Number(expenses.toFixed(2)),
      saved: Number((income - expenses).toFixed(2)),
      transactionCount: txs.length,
      byCategory,
      byMonth,
      topExpenses: txs
        .filter(t => t.type === 'expense')
        .sort((a, b) => Number(b.amount) - Number(a.amount))
        .slice(0, 5)
        .map(t => ({ label: t.label, amount: Number(t.amount), category: t.category })),
    };
  }
}
