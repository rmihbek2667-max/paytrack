import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AiModule } from './ai/ai.module';
import { TransactionsModule } from './transactions/transactions.module';
import { PushModule } from './push/push.module';
import { User } from './users/user.entity';
import { Transaction } from './transactions/transaction.entity';
import { PushToken } from './push/push-token.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, Transaction, PushToken],
      synchronize: true, // TEMPORARY — recreates schema, revert after one deploy
    }),
    UsersModule,
    AuthModule,
    AiModule,
    TransactionsModule,
    PushModule,
  ],
})
export class AppModule {}
