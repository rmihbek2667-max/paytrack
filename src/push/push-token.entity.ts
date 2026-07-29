import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, Unique,
} from 'typeorm';

@Entity('push_tokens')
@Unique(['userId', 'token']) // same device shouldn't register twice for one user
export class PushToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  // Expo push token, e.g. "ExponentPushToken[xxxxxxxxxxxx]"
  @Column()
  token!: string;

  @Column({ length: 20, nullable: true })
  platform!: string; // 'ios' | 'android' | 'web'

  @CreateDateColumn()
  createdAt!: Date;
}
