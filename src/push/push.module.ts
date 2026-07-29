import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PushToken } from './push-token.entity';
import { PushService } from './push.service';
import { PushController } from './push.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PushToken])],
  providers: [PushService],
  controllers: [PushController],
  exports: [PushService], // future payment webhook module will import this
})
export class PushModule {}
