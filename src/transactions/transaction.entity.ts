import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export type TransactionType = 'income' | 'expense';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  // Stored as positive number always -- type field determines direction
  @Column('decimal', { precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar', length: 10 })
  type!: TransactionType;

  @Column({ length: 50 })
  category!: string;

  @Column({ length: 100 })
  label!: string;

  @Column({ length: 255, nullable: true })
  note!: string;

  // Stored as date string YYYY-MM-DD so timezone never shifts it
  @Column({ type: 'varchar', length: 10 })
  date!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
